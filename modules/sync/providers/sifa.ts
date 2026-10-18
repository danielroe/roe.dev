import type { CollectionSchema, RecordInput } from 'airspace'
import type { l } from '@atproto/lex-schema'

import type { SyncItem, SyncOptions, SyncProvider } from './index.ts'
import type { ProjectRecord, TalkGroupRecord, TalkRecord } from '../../../shared/cms/records.ts'
import { rkeyFromUri } from '../../../shared/cms/talk-mapper.ts'
import { sifaCollections } from '../../../shared/sifa.ts'
import { useBuildAirspace, useBuildAirspaceWithSession } from '../../shared/airspace.ts'
import { dateFromTid } from '../../shared/tid.ts'

type Presentation = RecordInput<CollectionSchema<typeof sifaCollections.presentations>>
type Delivery = RecordInput<CollectionSchema<typeof sifaCollections.deliveries>>
type Project = RecordInput<CollectionSchema<typeof sifaCollections.projects>>
type PresentationLink = NonNullable<Delivery['links']>[number]

interface Source<V> {
  rkey: string
  value: V
}

/** `dev.roe.projectCategory` rkeys whose projects appear on Sifa. */
export const SIFA_PROJECT_CATEGORIES = new Set([
  '3my6ffubo2225', // Frameworks
  '3mtxxqxd7cr26', // Sites & web apps
  '3mtxxqyu2rz26', // Libraries
  '3mtxxr2ndsb26', // Tools
])

const VIRTUAL_LOCATIONS = new Set(['🌐', '🌍', '🌎', '🌏'])
const VIRTUAL_TYPES = new Set(['podcast', 'stream'])

const REGIONS: Record<string, string> = {
  gbeng: 'England',
  gbsct: 'Scotland',
  gbwls: 'Wales',
}

const REGIONAL_INDICATOR_A = 0x1F1E6
const BLACK_FLAG = 0x1F3F4
const TAG_BASE = 0xE0000
const TAG_CANCEL = 0xE007F

/** Parses a country or subdivision flag emoji into a structured address. */
export function addressFromFlag (flag: string | undefined): Delivery['address'] {
  if (!flag) return
  const points = [...flag.replace(/\uFE0F/g, '')].map(c => c.codePointAt(0)!)

  if (points.length === 2 && points.every(p => p >= REGIONAL_INDICATOR_A && p < REGIONAL_INDICATOR_A + 26)) {
    const country = String.fromCharCode(...points.map(p => p - REGIONAL_INDICATOR_A + 65))
    return { $type: 'community.lexicon.location.address', country }
  }

  if (points[0] === BLACK_FLAG && points.at(-1) === TAG_CANCEL && points.length > 4) {
    const tag = String.fromCharCode(...points.slice(1, -1).map(p => p - TAG_BASE))
    const region = REGIONS[tag]
    return {
      $type: 'community.lexicon.location.address',
      country: tag.slice(0, 2).toUpperCase(),
      ...(region ? { region } : {}),
    }
  }
}

export function toPresentation ({ rkey, value }: Source<TalkGroupRecord>): Presentation {
  return {
    title: value.title,
    ...(value.description ? { description: value.description } : {}),
    createdAt: (value.createdAt ?? dateFromTid(rkey)) as l.DatetimeString,
  }
}

/**
 * @param presentationUris AT-URIs of the `id.sifa.profile.presentation` records being
 *   published, keyed by the rkey of the `dev.roe.talkGroup` each mirrors.
 */
export function toDelivery ({ rkey, value }: Source<TalkRecord>, presentationUris: Map<string, string>): Delivery {
  const isVirtual = VIRTUAL_TYPES.has(value.type) || VIRTUAL_LOCATIONS.has(value.location?.replace(/\uFE0F/g, '') ?? '')
  const presentationUri = value.group && presentationUris.get(rkeyFromUri(value.group.uri))
  const address = isVirtual ? undefined : addressFromFlag(value.location)
  const role = value.type === 'workshop'
    ? 'id.sifa.defs#workshop'
    : VIRTUAL_TYPES.has(value.type) ? undefined : 'id.sifa.defs#presenter'

  const links: PresentationLink[] = []
  if (value.video) links.push({ uri: value.video as l.UriString, type: 'id.sifa.defs#linkRecording' })
  if (value.slides) links.push({ uri: `https://roe.dev/slides/${value.slides}.pdf`, type: 'id.sifa.defs#linkSlides' })
  if (value.link) links.push({ uri: value.link as l.UriString, type: value.type === 'podcast' ? 'id.sifa.defs#linkRecording' : 'id.sifa.defs#linkEvent' })
  if (value.demo) links.push({ uri: value.demo as l.UriString, label: 'Demo', type: 'id.sifa.defs#linkOther' })
  if (value.repo) links.push({ uri: value.repo as l.UriString, label: 'Source code', type: 'id.sifa.defs#linkOther' })

  return {
    ...(presentationUri ? { presentationRef: { uri: presentationUri as l.AtUriString } } : {}),
    ...(value.title ? { title: value.title } : {}),
    eventName: value.source,
    date: value.date.slice(0, 10),
    ...(role ? { role } : {}),
    ...(isVirtual ? { mode: 'community.lexicon.calendar.event#virtual' } : {}),
    ...(address ? { address } : {}),
    ...(links.length ? { links } : {}),
    createdAt: (value.createdAt ?? dateFromTid(rkey)) as l.DatetimeString,
  }
}

export function toProject ({ rkey, value }: Source<ProjectRecord>): Project {
  const url = (value.links?.find(link => link.role === 'community.lexicon.app.defs#linkRoleWebsite') ?? value.links?.[0])?.uri
  return {
    name: value.name,
    ...(value.description ? { description: value.description } : {}),
    ...(url ? { url: url as l.UriString } : {}),
    createdAt: (value.createdAt ?? dateFromTid(rkey)) as l.DatetimeString,
  }
}

interface MirrorTarget<V> {
  list: () => Promise<Array<{ rkey: string, value: unknown }>>
  put: (rkey: string, value: V) => Promise<unknown>
  delete: (rkey: string) => Promise<void>
}

/**
 * Makes a collection hold exactly `desired`: writes records that are new or
 * changed and deletes any other record in it.
 */
async function mirror<V> (target: MirrorTarget<V>, desired: Map<string, V>) {
  const existing = new Map((await target.list()).map(r => [r.rkey, r.value]))
  let written = 0
  let deleted = 0

  for (const [rkey, value] of desired) {
    const current = existing.get(rkey)
    if (current && stableJson({ ...current as object, $type: undefined }) === stableJson(value)) continue
    await target.put(rkey, value)
    written++
  }

  for (const rkey of existing.keys()) {
    if (desired.has(rkey)) continue
    await target.delete(rkey)
    deleted++
  }

  return { written, deleted }
}

function stableJson (value: unknown): string {
  return JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).sort(([a], [b]) => a.localeCompare(b)))
    : v)
}

export class SifaProvider implements SyncProvider {
  name = 'sifa'

  async sync (_items: SyncItem[], { dryRun }: SyncOptions): Promise<void> {
    const source = useBuildAirspace()
    const [{ did }, talkGroups, talks, projects] = await Promise.all([
      source.identity(),
      source.talkGroups.list(),
      source.talks.list(),
      source.projects.list(),
    ])

    if (!talks.length || !talkGroups.length || !projects.length) {
      throw new Error(`refusing to mirror an empty source (${talks.length} talks, ${talkGroups.length} talk groups, ${projects.length} projects)`)
    }

    const presentationUris = new Map(talkGroups.map(g => [g.rkey, `at://${did}/id.sifa.profile.presentation/${g.rkey}`]))
    const presentations = new Map(talkGroups.map(g => [g.rkey, toPresentation(g)]))
    const deliveries = new Map(talks.map(t => [t.rkey, toDelivery(t, presentationUris)]))
    const sifaProjects = new Map(projects
      .filter(p => SIFA_PROJECT_CATEGORIES.has(rkeyFromUri(p.value.category.uri)))
      .map(p => [p.rkey, toProject(p)]))

    if (dryRun) {
      console.info(`[sync:sifa] Would mirror ${presentations.size} presentations, ${deliveries.size} deliveries and ${sifaProjects.size} projects`)
      return
    }

    const airspace = await useBuildAirspaceWithSession(sifaCollections)
    const results = {
      presentations: await mirror(airspace.presentations as MirrorTarget<Presentation>, presentations),
      deliveries: await mirror(airspace.deliveries as MirrorTarget<Delivery>, deliveries),
      projects: await mirror(airspace.projects as MirrorTarget<Project>, sifaProjects),
    }

    for (const [collection, { written, deleted }] of Object.entries(results)) {
      console.info(`[sync:sifa] ${collection}: ${written} written, ${deleted} deleted`)
    }
  }
}
