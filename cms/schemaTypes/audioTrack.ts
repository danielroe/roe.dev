import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'audioTrack',
  title: 'Audio Track',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Track Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'string',
      initialValue: 'Harris Heller',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'string',
      options: {
        list: [
          { title: 'StreamBeats', value: 'streambeats' },
          { title: 'StreamBeats Lofi', value: 'streambeats-lofi' },
          { title: 'StreamBeats Chill', value: 'streambeats-chill' },
          { title: 'StreamBeats Study', value: 'streambeats-study' },
          { title: 'StreamBeats Gaming', value: 'streambeats-gaming' },
          { title: 'StreamBeats Hip Hop', value: 'streambeats-hiphop' },
          { title: 'StreamBeats Electronic', value: 'streambeats-electronic' },
          { title: 'StreamBeats Ambient', value: 'streambeats-ambient' },
          { title: 'Other', value: 'other' },
        ],
      },
      initialValue: 'streambeats',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Main folder/category from StreamBeats archive',
    }),
    defineField({
      name: 'subCategory',
      title: 'Sub-Category',
      type: 'string',
      description: 'Subfolder/subcategory from StreamBeats archive',
    }),
    defineField({
      name: 'folderPath',
      title: 'Original Folder Path',
      type: 'string',
      description: 'Full folder path from the StreamBeats archive',
      readOnly: true,
    }),
    defineField({
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: {
        accept: 'audio/*',
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Upbeat', value: 'upbeat' },
          { title: 'Chill', value: 'chill' },
          { title: 'Lofi', value: 'lofi' },
          { title: 'Electronic', value: 'electronic' },
          { title: 'Hip Hop', value: 'hiphop' },
          { title: 'Focus', value: 'focus' },
          { title: 'Study', value: 'study' },
          { title: 'Energetic', value: 'energetic' },
          { title: 'Ambient', value: 'ambient' },
          { title: 'Gaming', value: 'gaming' },
        ],
      },
    }),
    defineField({
      name: 'volume',
      title: 'Default Volume',
      type: 'number',
      initialValue: 0.7,
      validation: Rule => Rule.required().min(0).max(1),
      description: 'Default volume level (0.0 to 1.0)',
    }),
    defineField({
      name: 'isActive',
      title: 'Active for Selection',
      type: 'boolean',
      initialValue: true,
      description: 'Whether this track can be randomly selected for videos',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      description: 'Internal notes about this track',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'artist',
      media: 'audioFile',
    },
    prepare ({ title, subtitle }) {
      return {
        title: title || 'Untitled Track',
        subtitle: `by ${subtitle || 'Unknown Artist'}`,
      }
    },
  },
})
