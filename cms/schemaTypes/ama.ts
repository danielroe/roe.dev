import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'ama',
  title: 'Ask me anything',
  type: 'document',
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'string',
    }),
  ],
})
