import { belongsTo, defineCollections } from 'airspace'

import lexicons from '../lexicons.ts'

export const {
  ama,
  entity: entities,
  invite: invites,
  location,
  project: projects,
  projectCategory: projectCategories,
  sync: syncMarkers,
  talk: talks,
  talkGroup: talkGroups,
  usesCategory: usesCategories,
  usesItem: usesItems,
} = defineCollections(lexicons, c => ({
  project: {
    sort: [['order', 'asc']],
    relations: { category: belongsTo(c.projectCategory, 'category') },
  },
  projectCategory: {
    sort: [['order', 'asc']],
  },
  usesItem: {
    sort: [['order', 'asc']],
    relations: { category: belongsTo(c.usesCategory, 'category') },
  },
  usesCategory: {
    sort: [['order', 'asc']],
  },
  talk: {
    sort: [['date', 'desc']],
    relations: { group: belongsTo(c.talkGroup, 'group') },
  },
  talkGroup: {
    sort: [['title', 'asc']],
  },
  entity: {
    sort: [['name', 'asc']],
  },
  invite: {
    sort: [['createdAt', 'desc']],
  },
  ama: {
    sort: [['createdAt', 'desc']],
  },
}))

export const collections = {
  ama,
  entities,
  invites,
  location,
  projects,
  projectCategories,
  syncMarkers,
  talks,
  talkGroups,
  usesCategories,
  usesItems,
}
