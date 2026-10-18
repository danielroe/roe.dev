/**
 * The Sifa profile records this site publishes. They are kept out of
 * `shared/collections.ts` because that map drives the admin OAuth scopes, and
 * these are only ever written by the build-time sync.
 */
import { defineCollection } from 'airspace'

import { id } from './lex/index.ts'

export const sifaCollections = {
  presentations: defineCollection(id.sifa.profile.presentation.main),
  deliveries: defineCollection(id.sifa.profile.presentationDelivery.main),
  projects: defineCollection(id.sifa.profile.project.main),
}
