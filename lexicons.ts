/**
 * The `dev.roe.*` schemas the site's CMS reads and writes. `airspace lexicons
 * publish` reads this file; `shared/collections.ts` turns each record into a
 * collection.
 *
 * Field limits are load-bearing: they match the records already in the repo,
 * so tightening one makes existing records fail validation on read.
 *
 * Every record uses `record(fields, options)` rather than the bare field map,
 * so record metadata always sits in the same place. Four of these have a
 * `description` field, which the bare form would read as the record's own
 * description.
 */
import { defineLexicons, field, l, permissions, record } from 'airspace/lexicon'

import { community } from './shared/lex/index.ts'

const appDefs = community.lexicon.app.defs
const address = community.lexicon.location.address

const link = () => field.raw(l.ref(() => appDefs.link))
const image = () => field.raw(l.ref(() => appDefs.image))

/** A bare string def rather than an object, so its NSID has to be given explicitly. */
const status = () => field.raw(l.ref(() => appDefs.status, { nsid: 'community.lexicon.app.defs#status' }))

/** Written by the `timestamps` plugin, so optional on the way in. */
const createdAt = () => field.datetime().optional()

const ORDER_TOP = 'Lower values render first. Defaults to 100 in the editor.'
const ORDER_IN_CATEGORY = 'Lower values render first within the category. Defaults to 100 in the editor.'

const order = (description: string) => field.raw(l.withDefault(l.integer({ description }), 100)).optional()

export default defineLexicons('dev.roe', {
  projectCategory: record({
    title: field.text({ max: 256 }),
    order: order(ORDER_TOP),
    createdAt: createdAt(),
  }, { description: 'A category on the /projects page. Projects belong to a category via dev.roe.project.category.' }),

  project: record({
    category: field.ref('projectCategory').describe('Strong-ref to the parent dev.roe.projectCategory record.'),
    name: field.text({ max: 256 }),
    description: field.text({ max: 2500 }).optional(),
    links: field.list(link(), { max: 12 })
      .describe('Relevant destinations for the project. The site links the card at the first `linkRoleWebsite`, falling back to the first link of any role.')
      .optional(),
    images: field.list(image(), { max: 8 })
      .describe('Visual assets for the project. The site renders the first `purposeScreenshot`, falling back to the first image of any purpose.')
      .optional(),
    status: status().describe('Release or maintenance status. `unmaintained` and `discontinued` render the card as archived.').optional(),
    icon: field.text({ max: 64 }).describe('UnoCSS icon class, e.g. `i-ri:rocket-line`. Used when there is no image.').optional(),
    order: order(ORDER_IN_CATEGORY),
    createdAt: createdAt(),
  }, { description: 'A project on the /projects page, belonging to a dev.roe.projectCategory.' }),

  usesCategory: record({
    title: field.text({ max: 256 }),
    order: order(ORDER_TOP),
    displayAsGrid: field.raw(l.withDefault(l.boolean(), false)).optional(),
    createdAt: createdAt(),
  }, { description: 'A category on the /uses page. Items belong to a category via dev.roe.usesItem.category.' }),

  usesItem: record({
    category: field.ref('usesCategory').describe('Strong-ref to the parent dev.roe.usesCategory record.'),
    name: field.text({ max: 256 }),
    description: field.text({ max: 2500 }).optional(),
    order: order(ORDER_IN_CATEGORY),
    image: image().describe('Product shot or screenshot. Grid categories render it; list categories ignore it.').optional(),
    links: field.list(link(), { max: 32 }).optional(),
    createdAt: createdAt(),
  }, { description: 'A single item on the /uses page, belonging to a dev.roe.usesCategory.' }),

  talkGroup: record({
    title: field.text({ max: 256 }),
    description: field.text({ max: 2500 }).optional(),
    createdAt: createdAt(),
  }, { description: 'A talk given at one or more events. Holds the canonical title/description shared across performances; per-event details (date, source, video, etc.) live on dev.roe.talk records that strong-ref this group.' }),

  talk: record({
    title: field.text({ max: 512 }).describe('Optional for upcoming events with no announced title. Required for past talks unless the talk is part of a group.').optional(),
    description: field.text({ max: 5000 }).optional(),
    date: field.datetime().describe('Start date of the talk/event. Date-only values are stored as midnight UTC.'),
    endDate: field.datetime().describe('End date for multi-day events. Optional.').optional(),
    source: field.text({ max: 512 }).describe('Conference name, meetup, podcast title, etc.'),
    location: field.text({ max: 512 }).describe('Free-form: city, country, or \'Online\'.').optional(),
    type: field.raw(l.string({ knownValues: ['conference', 'meetup', 'podcast', 'workshop', 'stream', 'talk'] })),
    tags: field.list(field.text({ max: 64 }), { max: 32 }).optional(),
    link: field.url().describe('Event page, podcast episode URL, etc.').optional(),
    video: field.url().optional(),
    slides: field.raw(l.string({ maxLength: 512, description: 'Identifier for slides; historically a GitHub release tag from danielroe/slides.' })).optional(),
    demo: field.url().optional(),
    repo: field.url().optional(),
    group: field.ref('talkGroup').describe('Strong-ref to a dev.roe.talkGroup record.').optional(),
    image: image().describe('Event or conference logo, shown on the home page carousel.').optional(),
    createdAt: createdAt(),
  }, { description: 'A talk, podcast appearance, workshop, stream, or similar event.' }),

  location: record({
    address: field.raw(l.ref(() => address.main))
      .describe('Where I am: `locality` is the city, `region` the state/subdivision (used to special-case Scotland), `country` the ISO 3166-1 alpha-2 code (used to compute a flag emoji).'),
    meetupAvailable: field.raw(l.withDefault(l.boolean(), true)).optional(),
    createdAt: createdAt(),
  }, { key: 'self', description: 'Current location (singleton; rkey is always \'self\').' }),

  entity: record({
    name: field.text({ max: 256 }),
    socialHandles: field.object({
      bluesky: field.raw(l.string({ maxLength: 256, description: 'Handle without leading @ (e.g. nuxt.bsky.social)' })).optional(),
      linkedin: field.raw(l.string({ maxLength: 256, description: 'Company or person handle (e.g. nuxtjs)' })).optional(),
      mastodon: field.raw(l.string({ maxLength: 256, description: 'Full handle including instance (e.g. nuxt@fosstodon.org)' })).optional(),
    }).optional(),
    website: field.url().optional(),
    createdAt: createdAt(),
  }, { description: 'A person or organisation referenced by AMA responses via @-mentions. Holds the canonical name plus per-platform social handles so the publisher can rewrite mentions correctly for each platform.' }),

  ama: record({
    status: field.raw(l.string({ knownValues: ['unanswered', 'answered'] })),
    encryptedQuestion: field.raw(l.string({ maxLength: 500_000, description: 'AES-256-GCM envelope holding the raw question text. Present iff status=unanswered.' })).optional(),
    question: field.text({ max: 50_000 }).describe('Plaintext question. Present iff status=answered; the editor decrypts encryptedQuestion at publish time and writes it here so the record is self-contained going forward.').optional(),
    posts: field.list(field.object({
      text: field.text({ max: 50_000 }).describe('Body text. Plain text with `@<entity-rkey>` placeholders for entity mentions (e.g. `Thanks @abc123def456 for the help`). The placeholder syntax is internal; the publisher swaps them for the right per-platform handle.'),
      mentions: field.list(field.ref('entity'), { max: 32 })
        .describe('Strong-refs to dev.roe.entity records. The rkey of each referenced record is the placeholder token used in `text`.')
        .optional(),
    }), { max: 16 }).describe('Thread of response posts. Each post is the body of one Bluesky-thread item (and one Mastodon status, one LinkedIn comment chain entry, etc).').optional(),
    platforms: field.object({
      bluesky: field.raw(l.withDefault(l.boolean(), true)).optional(),
      mastodon: field.raw(l.withDefault(l.boolean(), true)).optional(),
      linkedin: field.raw(l.withDefault(l.boolean(), true)).optional(),
      youtubeShorts: field.raw(l.withDefault(l.boolean(), false)).optional(),
    }).describe('Which platforms the editor enabled when publishing.').optional(),
    publishedLinks: field.object({
      bluesky: field.url().optional(),
      mastodon: field.url().optional(),
      linkedin: field.url().optional(),
      youtubeShorts: field.url().optional(),
    }).describe('Resolved per-platform URLs after publish.').optional(),
    image: field.image({ max: 5_000_000 }).optional(),
    imageDimensions: field.raw(l.ref(() => appDefs.aspectRatio))
      .describe('Pixel dimensions of `image`. Stored alongside because PDS blobs don\'t carry intrinsic dimensions and Bluesky\'s image embed needs `aspectRatio`.')
      .optional(),
    backgroundStyle: field.raw(l.string({ maxLength: 128, description: 'ID of the background style used to render the image, either a preset name or a serialised custom emoji-and-gradient id. The set of styles is internal to roe.dev.' })).optional(),
    createdAt: createdAt(),
    answeredAt: field.datetime().optional(),
  }, { description: 'An anonymous question, optionally with a published answer. While unanswered the question text is encrypted server-side (private to roe.dev). Once published, the question is rewritten in plaintext alongside the answer and per-platform URLs.' }),

  invite: record({
    encrypted: field.raw(l.string({ maxLength: 8192, description: 'AES-256-GCM envelope holding `{ slug, repo }` as JSON. Opaque to anyone without the server key.' })),
    isActive: field.boolean().describe('Whether this invite is currently honoured. Inactive invites stay around for audit but don\'t get wired up in the route table.'),
    createdAt: createdAt(),
  }, { description: 'An invitation link that grants access to a private GitHub repository. Both the URL slug and the repo name are sensitive (knowing the slug equals being granted access), so the entire payload is encrypted server-side before being written to the PDS.' }),

  sync: record({
    provider: field.raw(l.string({ maxLength: 64, description: 'Identifier of the syndication target (e.g. `gde-advocu`).' })),
    canonicalUrl: field.url(),
    syncedAt: field.datetime(),
    createdAt: createdAt(),
  }, { description: 'Dedupe marker for a syndication pipeline. One record per (provider, canonical URL) pair that has been submitted; presence of a record means we\'ve already synced and shouldn\'t re-submit.' }),

  /** Everything the `/admin` OAuth client asks for, as one line on the consent screen. */
  cms: permissions({
    collections: ['ama', 'entity', 'invite', 'location', 'project', 'projectCategory', 'sync', 'talk', 'talkGroup', 'usesCategory', 'usesItem'],
    title: 'Manage roe.dev',
    detail: 'Read and write the talks, projects, uses, location, invites and AMA records behind roe.dev.',
  }),
})
