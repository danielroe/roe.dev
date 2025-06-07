import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'ama',
  title: 'Questions',
  type: 'document',
  preview: {
    select: {
      title: 'content',
      answered: 'answered',
      createdAt: '_createdAt',
    },
    prepare ({ title, answered, createdAt }) {
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

      return {
        title: title.slice(0, 50),
        subtitle: `${answered ? '✅ Answered' : '✨ Not answered'} • ${timeAgo}`,
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
