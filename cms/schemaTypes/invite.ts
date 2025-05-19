import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'invite',
  title: 'Invitation link',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
    }),
    defineField({
      name: 'repo',
      title: 'Repository to grant access to',
      type: 'string',
    }),
    defineField({
      name: 'isActive',
      type: 'boolean',
    }),
  ],
})
