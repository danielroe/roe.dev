import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'ama',
  title: 'Ask me anything',
  type: 'document',
  preview: {
    select: {
      title: 'content',
      answered: 'answered',
    },
    prepare ({ title, answered }) {
      return {
        title: title,
        subtitle: answered ? '✅ Answered' : '🚧 Not answered',
      }
    },
  },
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
      readOnly: true,
    }),
    defineField({
      name: 'answered',
      title: 'Answered',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'link',
      title: 'Bluesky link',
      type: 'url',
    }),
  ],
})
