import { defineField, defineType } from 'sanity'
import type { ComponentType } from 'react'
import GitHubSearchInput from '../components/GitHubSearchInput'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  preview: {
    select: {
      name: 'name',
      logo: 'logo',
      isPrivate: 'isPrivate',
      category: 'category',
    },
    prepare ({ name, logo, isPrivate }) {
      return {
        title: `${logo && !logo.startsWith('http') ? `${logo} ` : ''}${isPrivate ? '🔒 ' : ''}${name}`,
      }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'Project Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logo',
      title: 'Logo/Icon',
      type: 'string',
      description: 'Emoji or URL to a logo image',
      initialValue: '📦',
    }),
    defineField({
      name: 'githubRepo',
      title: 'GitHub Repository',
      type: 'object',
      components: {
        input: GitHubSearchInput as ComponentType<any>,
      },
      fields: [
        defineField({
          name: 'owner',
          title: 'Repository Owner',
          type: 'string',
        }),
        defineField({
          name: 'name',
          title: 'Repository Name',
          type: 'string',
        }),
        defineField({
          name: 'url',
          title: 'Repository URL',
          type: 'url',
          readOnly: true,
        }),
        defineField({
          name: 'lastUpdated',
          title: 'Last Updated',
          type: 'datetime',
          readOnly: true,
        }),
      ],
      preview: {
        select: {
          owner: 'owner',
          name: 'name',
        },
        prepare ({ owner, name }) {
          return {
            title: `${owner}/${name}`,
            subtitle: 'GitHub Repository',
          }
        },
      },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Framework', value: 'framework' },
          { title: 'Library', value: 'library' },
          { title: 'Tool', value: 'tool' },
          { title: 'Template', value: 'template' },
          { title: 'Example', value: 'example' },
          { title: 'Plugin', value: 'plugin' },
          { title: 'Extension', value: 'extension' },
          { title: 'Experiment', value: 'experiment' },
          { title: 'Documentation', value: 'docs' },
          { title: 'Other', value: 'other' },
        ],
      },
      initialValue: 'other',
    }),
    defineField({
      name: 'isPrivate',
      title: 'Private Project',
      type: 'boolean',
      description: 'Mark as private to exclude from public listings',
      initialValue: false,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean',
      description: 'Feature this project prominently',
      initialValue: false,
    }),
    defineField({
      name: 'links',
      title: 'Additional Links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'link',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'type',
              title: 'Link Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Documentation', value: 'docs' },
                  { title: 'Demo', value: 'demo' },
                  { title: 'Website', value: 'website' },
                  { title: 'NPM Package', value: 'npm' },
                  { title: 'Playground', value: 'playground' },
                  { title: 'Other', value: 'other' },
                ],
              },
              initialValue: 'other',
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'url',
              type: 'type',
            },
            prepare ({ title, subtitle, type }) {
              return {
                title,
                subtitle: `${type} • ${subtitle}`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 100,
    }),
  ],
  orderings: [
    {
      title: 'Featured First',
      name: 'featuredFirst',
      by: [
        { field: 'isFeatured', direction: 'desc' },
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    },
    {
      title: 'Category',
      name: 'category',
      by: [
        { field: 'category', direction: 'asc' },
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    },
    {
      title: 'Last Updated',
      name: 'lastUpdated',
      by: [{ field: 'githubRepo.lastUpdated', direction: 'desc' }],
    },
  ],
})
