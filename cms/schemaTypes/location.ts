import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'location',
  title: 'Current Location',
  type: 'document',
  preview: {
    select: {
      city: 'city',
      country: 'country',
      countryCode: 'countryCode',
      region: 'region',
    },
    prepare ({ city, country, countryCode, region }) {
      const flagEmoji = region === 'Scotland'
        ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
        : countryCode
          ? String.fromCodePoint(...[...countryCode.toUpperCase()].map(char =>
              char.charCodeAt(0) + 127397))
          : '🌍'

      return {
        title: `${city}${country ? `, ${country}` : ''}`,
        subtitle: 'Current Location',
        media: flagEmoji,
      }
    },
  },
  fields: [
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Region/State',
      type: 'string',
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'countryCode',
      title: 'Country Code (for flag emoji)',
      type: 'string',
      description: 'Two-letter country code (e.g., "US" for United States)',
      validation: Rule => Rule.required().length(2),
    }),
    defineField({
      name: 'latitude',
      title: 'Latitude',
      type: 'number',
    }),
    defineField({
      name: 'longitude',
      title: 'Longitude',
      type: 'number',
    }),
    defineField({
      name: 'meetupAvailable',
      title: 'Available for Meetups',
      type: 'boolean',
      description: 'Are you currently available to meet up with people in this location?',
      initialValue: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      initialValue: new Date().toISOString(),
    }),
  ],
})
