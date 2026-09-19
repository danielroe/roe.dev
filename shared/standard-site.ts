/**
 * The standard.site records this site publishes. They are kept out of
 * `shared/collections.ts` because that map drives the admin OAuth scopes, and
 * these are only ever written by the build-time sync.
 */
import { defineCollection } from 'airspace'

import { site } from './lex/index.ts'

export const standardSiteCollections = {
  publication: defineCollection(site.standard.publication.main),
  documents: defineCollection(site.standard.document.main),
}
