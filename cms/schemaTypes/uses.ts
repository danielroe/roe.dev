import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'uses',
  title: 'Uses',
  type: 'document',
  fields: [
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Used to control the order of categories',
      initialValue: 100,
    }),
    defineField({
      name: 'displayAsGrid',
      title: 'Display as Grid',
      type: 'boolean',
      description: 'Display items in a grid layout instead of a list',
      initialValue: false,
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'item',
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
            }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'link',
                  fields: [
                    defineField({
                      name: 'url',
                      title: 'URL',
                      type: 'url',
                      validation: Rule => Rule.required(),
                    }),
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                    }),
                  ],
                  preview: {
                    select: {
                      title: 'label',
                      subtitle: 'url',
                    },
                  },
                },
              ],
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'order',
              title: 'Order',
              type: 'number',
              description: 'Used to control the order of items within a category',
              initialValue: 100,
            }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'description',
              media: 'image',
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'category',
      subtitle: 'order',
    },
    prepare ({ title, subtitle }) {
      return {
        title,
        subtitle: `Order: ${subtitle}`,
      }
    },
  },
})
