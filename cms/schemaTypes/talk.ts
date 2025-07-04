import { defineField, defineType } from 'sanity'
import { GitHubReleaseInput } from '../components/GitHubReleaseInput'

export default defineType({
  name: 'talk',
  title: 'Talk',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Leave empty for upcoming events if title is not yet decided',
    }),
    defineField({
      name: 'group',
      title: 'Talk Group/Series',
      type: 'reference',
      to: [{ type: 'talkGroup' }],
      description: 'Group this talk with others in the same series',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End date (for multi-day events)',
      type: 'date',
      validation: Rule => Rule.custom((endDate, context) => {
        const startDate = (context.document as any)?.date
        if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
          return 'End date must be after start date'
        }
        return true
      }),
    }),
    defineField({
      name: 'source',
      title: 'Event/Source',
      type: 'string',
      description: 'Conference, meetup, podcast name, etc.',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City, country, or "Online"',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Conference Talk', value: 'conference' },
          { title: 'Meetup Talk', value: 'meetup' },
          { title: 'Podcast', value: 'podcast' },
          { title: 'Workshop', value: 'workshop' },
          { title: 'Stream', value: 'stream' },
          { title: 'Other', value: 'talk' },
        ],
      },
      initialValue: 'conference',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'episode',
      title: 'Episode Number',
      type: 'number',
      description: 'For podcasts or numbered events',
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
      name: 'link',
      title: 'Event Link',
      type: 'url',
      description: 'Link to event page, podcast episode, etc.',
    }),
    defineField({
      name: 'video',
      title: 'Video Link',
      type: 'url',
      description: 'YouTube, Vimeo, or other video link',
    }),
    defineField({
      name: 'slides',
      title: 'Slides (GitHub Release)',
      type: 'string',
      description: 'Select a release from danielroe/slides repository',
      components: {
        input: GitHubReleaseInput,
      },
    }),
    defineField({
      name: 'demo',
      title: 'Demo Link',
      type: 'url',
      description: 'Link to live demo',
    }),
    defineField({
      name: 'repo',
      title: 'Repository Link',
      type: 'url',
      description: 'Link to code repository',
    }),
    defineField({
      name: 'image',
      title: 'Event Image',
      type: 'image',
      description: 'Event logo or promotional image',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      source: 'source',
      date: 'date',
      type: 'type',
      image: 'image',
    },
    prepare ({ title, source, date, type, image }) {
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date'
      const isPast = date ? new Date(date) < new Date() : false
      const status = isPast ? '✅' : '📅'

      return {
        title: title || `${source} (${type})`,
        subtitle: `${status} ${formattedDate} • ${source}`,
        media: image,
      }
    },
  },
  orderings: [
    {
      title: 'Date (newest first)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Date (oldest first)',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
    {
      title: 'Source A-Z',
      name: 'sourceAsc',
      by: [{ field: 'source', direction: 'asc' }],
    },
  ],
  initialValue: {
    type: 'conference',
    tags: [],
  },
})
