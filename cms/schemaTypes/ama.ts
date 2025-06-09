import { defineField, defineType } from 'sanity'
import { CharacterCountInput } from '../components/CharacterCountInput'
import { ImageGenerator } from '../components/ImageGenerator'

export default defineType({
  name: 'ama',
  title: 'Questions',
  type: 'document',
  preview: {
    select: {
      title: 'content',
      status: 'publishStatus',
      createdAt: '_createdAt',
    },
    prepare ({ title, status, createdAt }) {
      const now = new Date()
      const created = new Date(createdAt)
      const diffMs = now.getTime() - created.getTime()

      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

      let timeAgo
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffSeconds / 60)
      const diffHours = Math.floor(diffMinutes / 60)
      const diffDays = Math.floor(diffHours / 24)
      const diffWeeks = Math.floor(diffDays / 7)
      const diffMonths = Math.floor(diffDays / 30)
      const diffYears = Math.floor(diffDays / 365)

      if (diffYears > 0) {
        timeAgo = rtf.format(-diffYears, 'year')
      }
      else if (diffMonths > 0) {
        timeAgo = rtf.format(-diffMonths, 'month')
      }
      else if (diffWeeks > 0) {
        timeAgo = rtf.format(-diffWeeks, 'week')
      }
      else if (diffDays > 0) {
        timeAgo = rtf.format(-diffDays, 'day')
      }
      else if (diffHours > 0) {
        timeAgo = rtf.format(-diffHours, 'hour')
      }
      else if (diffMinutes > 0) {
        timeAgo = rtf.format(-diffMinutes, 'minute')
      }
      else {
        timeAgo = 'now'
      }

      const statusEmoji: Record<string, string> = {
        draft: '📝',
        ready: '🚀',
        published: '✅',
        failed: '❌',
      }

      const statusDisplay = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft'

      return {
        title: title.slice(0, 50),
        subtitle: `${statusEmoji[status || 'draft']} ${statusDisplay} • ${timeAgo}`,
      }
    },
  },
  fields: [
    defineField({
      name: 'content',
      title: 'Question',
      type: 'text',
      rows: 3,
      readOnly: true,
    }),
    defineField({
      name: 'posts',
      title: 'Response',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Post',
          fields: [
            {
              name: 'content',
              title: 'Post content',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        name: 'entityMention',
                        type: 'object',
                        title: 'Account',
                        fields: [
                          {
                            name: 'entity',
                            type: 'reference',
                            to: [{ type: 'entity' }],
                          },
                        ],
                      },
                      {
                        name: 'link',
                        type: 'object',
                        title: 'Link',
                        fields: [
                          {
                            name: 'href',
                            type: 'url',
                            title: 'URL',
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              components: {
                input: CharacterCountInput,
              },
            },
          ],
          preview: {
            select: {
              content: 'content',
            },
            prepare ({ content }) {
              const firstBlock = content?.[0]
              const text = firstBlock?.children?.map((child: any) => child.text || '').join('') || ''
              return {
                title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
                subtitle: `${text.length} characters`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'answered',
      title: 'Answered',
      type: 'boolean',
      initialValue: false,
      // keep only for legacay questions
      hidden: true,
    }),
    defineField({
      name: 'publishStatus',
      title: 'Publish status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Ready to publish', value: 'ready' },
          { title: 'Published', value: 'published' },
          { title: 'Failed', value: 'failed' },
        ],
      },
      initialValue: 'draft',
      // readOnly: ({ document }) => document?.publishStatus === 'ready' || document?.publishStatus === 'published',
    }),
    defineField({
      name: 'generatedImage',
      title: 'Generated image',
      type: 'image',
      options: {
        hotspot: true,
      },
      components: {
        input: ImageGenerator,
      },
      readOnly: ({ document }) => document?.publishStatus === 'published',
    }),
    defineField({
      name: 'publishedLinks',
      title: 'Published links',
      type: 'object',
      fields: [
        defineField({
          name: 'bluesky',
          title: 'Bluesky link',
          type: 'url',
        }),
        defineField({
          name: 'linkedin',
          title: 'LinkedIn link',
          type: 'url',
        }),
        defineField({
          name: 'mastodon',
          title: 'Mastodon link',
          type: 'url',
        }),
      ],
      readOnly: true,
      hidden: ({ document }) => document?.publishStatus !== 'published',
    }),
    defineField({
      name: 'platforms',
      title: 'Publish to platforms',
      type: 'object',
      fields: [
        defineField({
          name: 'bluesky',
          title: 'Bluesky',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'mastodon',
          title: 'Mastodon',
          type: 'boolean',
          initialValue: true,
        }),
      ],
      readOnly: ({ document }) => document?.publishStatus === 'draft',
    }),
    defineField({
      name: 'publishLog',
      title: 'Publish log',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'timestamp',
              title: 'Timestamp',
              type: 'datetime',
            },
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
            },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: ['success', 'error'],
              },
            },
            {
              name: 'message',
              title: 'Message',
              type: 'text',
            },
          ],
        },
      ],
      readOnly: true,
      hidden: ({ document }) => !document?.publishLog || (Array.isArray(document.publishLog) && document.publishLog.length === 0),
    }),
    defineField({
      name: 'lastWebhookEvent',
      title: 'Last webhook event',
      type: 'object',
      fields: [
        defineField({
          name: 'timestamp',
          title: 'Timestamp',
          type: 'datetime',
        }),
        defineField({
          name: 'signature',
          title: 'Signature',
          type: 'string',
        }),
      ],
      // hidden: true,
    }),
    // Legacy field for backward compatibility
    defineField({
      name: 'link',
      title: 'Bluesky link (legacy)',
      type: 'url',
      hidden: true,
    }),
  ],
})
