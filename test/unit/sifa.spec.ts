import { describe, expect, it } from 'vitest'

import { addressFromFlag, toDelivery, toPresentation, toProject } from '../../modules/sync/providers/sifa'
import { dateFromTid, tidFromDate } from '../../modules/shared/tid'
import type { ProjectRecord, TalkRecord } from '../../shared/cms/records'

const did = 'did:plc:jbeaa5kdaladzwq3r7f5xgwe'
const groupUri = `at://${did}/dev.roe.talkGroup/3mnhtz6v4ss2v`
const presentationUris = new Map([['3mnhtz6v4ss2v', `at://${did}/id.sifa.profile.presentation/3mnhtz6v4ss2v`]])

function talk (value: Partial<TalkRecord>) {
  return {
    rkey: '3mx3duxyit62s',
    value: {
      $type: 'dev.roe.talk',
      date: '2026-09-24T00:00:00.000Z',
      source: 'PostgreSQL Edinburgh',
      type: 'meetup',
      createdAt: '2026-09-24T09:32:06.462Z',
      ...value,
    } as TalkRecord,
  }
}

describe('addressFromFlag', () => {
  it('reads a country flag', () => {
    expect(addressFromFlag('🇳🇱')).toEqual({ $type: 'community.lexicon.location.address', country: 'NL' })
  })

  it('reads a subdivision flag', () => {
    expect(addressFromFlag('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toEqual({ $type: 'community.lexicon.location.address', country: 'GB', region: 'Scotland' })
  })

  it('ignores anything else', () => {
    expect(addressFromFlag('🌐')).toBeUndefined()
    expect(addressFromFlag('Amsterdam')).toBeUndefined()
    expect(addressFromFlag(undefined)).toBeUndefined()
  })
})

describe('toDelivery', () => {
  it('maps a grouped conference talk', () => {
    const delivery = toDelivery(talk({
      title: 'What\'s new in Nuxt 4',
      type: 'conference',
      source: 'Vue.js Amsterdam',
      location: '🇳🇱',
      group: { uri: groupUri, cid: 'bafy' } as TalkRecord['group'],
      video: 'https://www.youtube.com/watch?v=abc',
      slides: '2025-03-12-vuejs-amsterdam',
      link: 'https://vuejs.amsterdam',
    }), presentationUris)

    expect(delivery).toEqual({
      presentationRef: { uri: `at://${did}/id.sifa.profile.presentation/3mnhtz6v4ss2v` },
      title: 'What\'s new in Nuxt 4',
      eventName: 'Vue.js Amsterdam',
      date: '2026-09-24',
      role: 'id.sifa.defs#presenter',
      address: { $type: 'community.lexicon.location.address', country: 'NL' },
      links: [
        { uri: 'https://www.youtube.com/watch?v=abc', type: 'id.sifa.defs#linkRecording' },
        { uri: 'https://roe.dev/slides/2025-03-12-vuejs-amsterdam.pdf', type: 'id.sifa.defs#linkSlides' },
        { uri: 'https://vuejs.amsterdam', type: 'id.sifa.defs#linkEvent' },
      ],
      createdAt: '2026-09-24T09:32:06.462Z',
    })
  })

  it('maps a podcast as a virtual delivery with no role', () => {
    const delivery = toDelivery(talk({ type: 'podcast', source: 'DejaVue', link: 'https://www.youtube.com/watch?v=xyz' }), presentationUris)

    expect(delivery.role).toBeUndefined()
    expect(delivery.mode).toBe('community.lexicon.calendar.event#virtual')
    expect(delivery.links).toEqual([{ uri: 'https://www.youtube.com/watch?v=xyz', type: 'id.sifa.defs#linkRecording' }])
  })

  it('maps a globe location to a virtual delivery', () => {
    const delivery = toDelivery(talk({ type: 'conference', location: '🌐' }), presentationUris)

    expect(delivery.mode).toBe('community.lexicon.calendar.event#virtual')
    expect(delivery.address).toBeUndefined()
  })

  it('maps a workshop role', () => {
    expect(toDelivery(talk({ type: 'workshop' }), presentationUris).role).toBe('id.sifa.defs#workshop')
  })

  it('maps an explicit role', () => {
    expect(toDelivery(talk({ type: 'conference', role: 'keynote' }), presentationUris).role).toBe('id.sifa.defs#keynote')
    expect(toDelivery(talk({ type: 'stream', role: 'host' }), presentationUris).role).toBe('id.sifa.defs#host')
  })

  it('omits references to unknown groups', () => {
    const delivery = toDelivery(talk({ group: { uri: `at://${did}/dev.roe.talkGroup/3aaaaaaaaaaaa`, cid: 'bafy' } as TalkRecord['group'] }), presentationUris)

    expect(delivery.presentationRef).toBeUndefined()
  })
})

describe('toPresentation', () => {
  it('falls back to the rkey timestamp for createdAt', () => {
    const rkey = tidFromDate('2025-07-04T19:16:36.000Z')
    expect(toPresentation({ rkey, value: { $type: 'dev.roe.talkGroup', title: 'A new Nuxt' } }))
      .toEqual({ title: 'A new Nuxt', createdAt: '2025-07-04T19:16:36.000Z' })
  })
})

describe('toProject', () => {
  it('prefers the website link', () => {
    const project = toProject({
      rkey: '3mtxxr3iiwr26',
      value: {
        $type: 'dev.roe.project',
        name: 'magic-regexp',
        role: 'Creator',
        description: 'A compiled-away, type-safe, readable RegExp alternative',
        category: { uri: `at://${did}/dev.roe.projectCategory/3mtxxqyu2rz26`, cid: 'bafy' },
        links: [
          { uri: 'https://github.com/unjs/magic-regexp', role: 'community.lexicon.app.defs#linkRoleSourceCode' },
          { uri: 'https://regexp.dev', role: 'community.lexicon.app.defs#linkRoleWebsite' },
        ],
        createdAt: '2026-08-26T08:58:54.746Z',
      } as ProjectRecord,
    })

    expect(project).toEqual({
      name: 'magic-regexp',
      role: 'Creator',
      description: 'A compiled-away, type-safe, readable RegExp alternative',
      url: 'https://regexp.dev',
      createdAt: '2026-08-26T08:58:54.746Z',
    })
  })
})

describe('dateFromTid', () => {
  it('round-trips with tidFromDate', () => {
    expect(dateFromTid(tidFromDate('2019-12-10T20:18:52.000Z'))).toBe('2019-12-10T20:18:52.000Z')
  })
})
