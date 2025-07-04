import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'talkGroup',
  title: 'Talk Group/Series',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      description: 'description',
    },
    prepare ({ title, description }) {
      return {
        title,
        subtitle: description,
      }
    },
  },
})
