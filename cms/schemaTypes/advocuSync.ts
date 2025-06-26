export default {
  name: 'advocuSync',
  type: 'document',
  title: 'Advocu Sync',
  fields: [
    {
      name: 'canonical_url',
      type: 'url',
      title: 'Canonical URL',
    },
    {
      name: 'syncedAt',
      type: 'datetime',
      title: 'Synced At',
    },
  ],
}
