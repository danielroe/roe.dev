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
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'answered',
      title: 'Answered',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
