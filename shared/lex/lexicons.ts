/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util.ts'

export const schemaDict = {
  ComAtprotoRepoStrongRef: {
    lexicon: 1,
    id: 'com.atproto.repo.strongRef',
    description: 'A URI with a content-hash fingerprint.',
    defs: {
      main: {
        type: 'object',
        required: ['uri', 'cid'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          cid: {
            type: 'string',
            format: 'cid',
          },
        },
      },
    },
  },
  DevRoeAma: {
    lexicon: 1,
    id: 'dev.roe.ama',
    defs: {
      main: {
        type: 'record',
        description:
          'An anonymous question, optionally with a published answer. While unanswered the question text is encrypted server-side (private to roe.dev). Once published, the question is rewritten in plaintext alongside the answer and per-platform URLs.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['status', 'createdAt'],
          properties: {
            status: {
              type: 'string',
              knownValues: ['unanswered', 'answered'],
            },
            encryptedQuestion: {
              type: 'string',
              description:
                'AES-256-GCM envelope holding the raw question text. Present iff status=unanswered.',
            },
            question: {
              type: 'string',
              description:
                'Plaintext question. Present iff status=answered; the editor decrypts encryptedQuestion at publish time and writes it here so the record is self-contained going forward.',
              maxLength: 200000,
              maxGraphemes: 50000,
            },
            posts: {
              type: 'array',
              description:
                'Thread of response posts. Each post is the body of one Bluesky-thread item (and one Mastodon status, one LinkedIn comment chain entry, etc).',
              items: {
                type: 'ref',
                ref: 'lex:dev.roe.ama#post',
              },
              maxLength: 16,
            },
            platforms: {
              type: 'ref',
              ref: 'lex:dev.roe.ama#platforms',
              description:
                'Which platforms the editor enabled when publishing.',
            },
            publishedLinks: {
              type: 'ref',
              ref: 'lex:dev.roe.ama#publishedLinks',
              description: 'Resolved per-platform URLs after publish.',
            },
            image: {
              type: 'blob',
              accept: ['image/*'],
              maxSize: 5000000,
            },
            imageDimensions: {
              type: 'ref',
              ref: 'lex:dev.roe.ama#imageDimensions',
              description:
                "Pixel dimensions of `image`. Stored alongside because PDS blobs don't carry intrinsic dimensions and Bluesky's image embed needs `aspectRatio`.",
            },
            backgroundStyle: {
              type: 'string',
              description:
                'ID of the background style used to render the image. See `shared/cms/backgrounds.ts`.',
              maxLength: 64,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            answeredAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
      post: {
        type: 'object',
        description:
          'One post in the response thread. Mentions reference dev.roe.entity records by AT URI so the publisher can rewrite per-platform handles at publish time.',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            description:
              'Body text. Plain text with `@<entity-rkey>` placeholders for entity mentions (e.g. `Thanks @abc123def456 for the help`). The placeholder syntax is internal; the publisher swaps them for the right per-platform handle.',
            maxLength: 200000,
            maxGraphemes: 50000,
          },
          mentions: {
            type: 'array',
            description:
              'Strong-refs to dev.roe.entity records keyed by the placeholder token used in `text` (the entity rkey).',
            items: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            maxLength: 32,
          },
        },
      },
      platforms: {
        type: 'object',
        properties: {
          bluesky: {
            type: 'boolean',
            default: true,
          },
          mastodon: {
            type: 'boolean',
            default: true,
          },
          linkedin: {
            type: 'boolean',
            default: true,
          },
          youtubeShorts: {
            type: 'boolean',
            default: false,
          },
        },
      },
      publishedLinks: {
        type: 'object',
        properties: {
          bluesky: {
            type: 'string',
            format: 'uri',
          },
          mastodon: {
            type: 'string',
            format: 'uri',
          },
          linkedin: {
            type: 'string',
            format: 'uri',
          },
          youtubeShorts: {
            type: 'string',
            format: 'uri',
          },
        },
      },
      imageDimensions: {
        type: 'object',
        required: ['width', 'height'],
        properties: {
          width: {
            type: 'integer',
            minimum: 1,
          },
          height: {
            type: 'integer',
            minimum: 1,
          },
        },
      },
    },
  },
  DevRoeEntity: {
    lexicon: 1,
    id: 'dev.roe.entity',
    defs: {
      main: {
        type: 'record',
        description:
          'A person or organisation referenced by AMA responses via @-mentions. Holds the canonical name plus per-platform social handles so the publisher can rewrite mentions correctly for each platform.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              maxLength: 1024,
              maxGraphemes: 256,
            },
            socialHandles: {
              type: 'ref',
              ref: 'lex:dev.roe.entity#socialHandles',
            },
            website: {
              type: 'string',
              format: 'uri',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
      socialHandles: {
        type: 'object',
        properties: {
          bluesky: {
            type: 'string',
            description: 'Handle without leading @ (e.g. nuxt.bsky.social)',
            maxLength: 256,
          },
          linkedin: {
            type: 'string',
            description: 'Company or person handle (e.g. nuxtjs)',
            maxLength: 256,
          },
          mastodon: {
            type: 'string',
            description:
              'Full handle including instance (e.g. nuxt@fosstodon.org)',
            maxLength: 256,
          },
        },
      },
    },
  },
  DevRoeInvite: {
    lexicon: 1,
    id: 'dev.roe.invite',
    defs: {
      main: {
        type: 'record',
        description:
          'An invitation link that grants access to a private GitHub repository. Both the URL slug and the repo name are sensitive (knowing the slug equals being granted access), so the entire payload is encrypted server-side before being written to the PDS.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['encrypted', 'isActive', 'createdAt'],
          properties: {
            encrypted: {
              type: 'string',
              description:
                'AES-256-GCM envelope (see server/utils/admin/encryption.ts) holding { slug, repo } as JSON. Opaque to anyone without the server key.',
            },
            isActive: {
              type: 'boolean',
              description:
                "Whether this invite is currently honoured. Inactive invites stay around for audit but don't get wired up in the route table.",
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  DevRoeLocation: {
    lexicon: 1,
    id: 'dev.roe.location',
    defs: {
      main: {
        type: 'record',
        description: "Current location (singleton; rkey is always 'self').",
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['city', 'country', 'countryCode', 'createdAt'],
          properties: {
            city: {
              type: 'string',
              maxLength: 1024,
              maxGraphemes: 256,
            },
            region: {
              type: 'string',
              description:
                'Region/state. Used to special-case Scotland and US/UK subdivisions on the public site.',
              maxLength: 1024,
              maxGraphemes: 256,
            },
            country: {
              type: 'string',
              maxLength: 1024,
              maxGraphemes: 256,
            },
            countryCode: {
              type: 'string',
              description:
                'ISO 3166-1 alpha-2 country code, uppercase. Used to compute a flag emoji.',
              minLength: 2,
              maxLength: 2,
            },
            meetupAvailable: {
              type: 'boolean',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  DevRoeSync: {
    lexicon: 1,
    id: 'dev.roe.sync',
    defs: {
      main: {
        type: 'record',
        description:
          "Dedupe marker for a syndication pipeline. One record per (provider, canonical URL) pair that has been submitted; presence of a record means we've already synced and shouldn't re-submit.",
        key: 'tid',
        record: {
          type: 'object',
          required: ['provider', 'canonicalUrl', 'syncedAt'],
          properties: {
            provider: {
              type: 'string',
              description:
                'Identifier of the syndication target (e.g. `gde-advocu`).',
              maxLength: 64,
            },
            canonicalUrl: {
              type: 'string',
              format: 'uri',
            },
            syncedAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  DevRoeTalk: {
    lexicon: 1,
    id: 'dev.roe.talk',
    defs: {
      main: {
        type: 'record',
        description:
          'A talk, podcast appearance, workshop, stream, or similar event.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['source', 'date', 'type', 'createdAt'],
          properties: {
            title: {
              type: 'string',
              description:
                'Optional for upcoming events with no announced title. Required for past talks unless the talk is part of a group.',
              maxLength: 2048,
              maxGraphemes: 512,
            },
            description: {
              type: 'string',
              maxLength: 20000,
              maxGraphemes: 5000,
            },
            date: {
              type: 'string',
              format: 'datetime',
              description:
                'Start date of the talk/event. Date-only values are stored as midnight UTC.',
            },
            endDate: {
              type: 'string',
              format: 'datetime',
              description: 'End date for multi-day events. Optional.',
            },
            source: {
              type: 'string',
              description: 'Conference name, meetup, podcast title, etc.',
              maxLength: 2048,
              maxGraphemes: 512,
            },
            location: {
              type: 'string',
              description: "Free-form: city, country, or 'Online'.",
              maxLength: 2048,
              maxGraphemes: 512,
            },
            type: {
              type: 'string',
              knownValues: [
                'conference',
                'meetup',
                'podcast',
                'workshop',
                'stream',
                'talk',
              ],
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 256,
                maxGraphemes: 64,
              },
              maxLength: 32,
            },
            link: {
              type: 'string',
              format: 'uri',
              description: 'Event page, podcast episode URL, etc.',
            },
            video: {
              type: 'string',
              format: 'uri',
            },
            slides: {
              type: 'string',
              description:
                'Identifier for slides; historically a GitHub release tag from danielroe/slides.',
            },
            demo: {
              type: 'string',
              format: 'uri',
            },
            repo: {
              type: 'string',
              format: 'uri',
            },
            group: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
              description: 'Strong-ref to a dev.roe.talkGroup record.',
            },
            image: {
              type: 'blob',
              accept: ['image/*'],
              maxSize: 5000000,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  DevRoeTalkGroup: {
    lexicon: 1,
    id: 'dev.roe.talkGroup',
    defs: {
      main: {
        type: 'record',
        description:
          'A talk given at one or more events. Holds the canonical title/description shared across performances; per-event details (date, source, video, etc.) live on dev.roe.talk records that strong-ref this group.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['title', 'createdAt'],
          properties: {
            title: {
              type: 'string',
              maxLength: 1024,
              maxGraphemes: 256,
            },
            description: {
              type: 'string',
              maxLength: 10000,
              maxGraphemes: 2500,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  DevRoeUsesCategory: {
    lexicon: 1,
    id: 'dev.roe.usesCategory',
    defs: {
      main: {
        type: 'record',
        description:
          'A category on the /uses page. Items belong to a category via dev.roe.usesItem.category.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['title', 'createdAt'],
          properties: {
            title: {
              type: 'string',
              maxLength: 1024,
              maxGraphemes: 256,
            },
            order: {
              type: 'integer',
              description:
                'Lower values render first. Defaults to 100 in the editor.',
              default: 100,
            },
            displayAsGrid: {
              type: 'boolean',
              default: false,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  DevRoeUsesItem: {
    lexicon: 1,
    id: 'dev.roe.usesItem',
    defs: {
      main: {
        type: 'record',
        description:
          'A single item on the /uses page, belonging to a dev.roe.usesCategory.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['category', 'name', 'createdAt'],
          properties: {
            category: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
              description:
                'Strong-ref to the parent dev.roe.usesCategory record.',
            },
            name: {
              type: 'string',
              maxLength: 1024,
              maxGraphemes: 256,
            },
            description: {
              type: 'string',
              maxLength: 10000,
              maxGraphemes: 2500,
            },
            order: {
              type: 'integer',
              description:
                'Lower values render first within the category. Defaults to 100 in the editor.',
              default: 100,
            },
            image: {
              type: 'blob',
              accept: ['image/*'],
              maxSize: 5000000,
            },
            links: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:dev.roe.usesItem#link',
              },
              maxLength: 32,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
      link: {
        type: 'object',
        required: ['url'],
        properties: {
          url: {
            type: 'string',
            format: 'uri',
          },
          label: {
            type: 'string',
            maxLength: 256,
            maxGraphemes: 64,
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
  DevRoeAma: 'dev.roe.ama',
  DevRoeEntity: 'dev.roe.entity',
  DevRoeInvite: 'dev.roe.invite',
  DevRoeLocation: 'dev.roe.location',
  DevRoeSync: 'dev.roe.sync',
  DevRoeTalk: 'dev.roe.talk',
  DevRoeTalkGroup: 'dev.roe.talkGroup',
  DevRoeUsesCategory: 'dev.roe.usesCategory',
  DevRoeUsesItem: 'dev.roe.usesItem',
} as const
