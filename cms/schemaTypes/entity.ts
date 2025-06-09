import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'entity',
  title: 'Account',
  type: 'document',
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'socialHandles',
      title: 'Social media handles',
      type: 'object',
      fields: [
        defineField({
          name: 'bluesky',
          title: 'Bluesky handle',
          type: 'string',
          description: 'Handle without @ symbol (e.g., nuxt.bsky.social)',
        }),
        defineField({
          name: 'linkedin',
          title: 'Linkedin handle',
          type: 'string',
          description: 'Company or person handle (e.g., nuxtjs)',
        }),
        defineField({
          name: 'mastodon',
          title: 'Mastodon handle',
          type: 'string',
          description: 'Full handle with instance (e.g., nuxt@fosstodon.org)',
        }),
      ],
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})
