import { defineEventHandler } from 'nuxt/server'
import { imageMeta } from 'image-meta'
import { $fetch } from 'ofetch'

import { formatConferenceDates, getUpcomingTalks } from '../utils/cms/talks'
import type { UpcomingConference } from '../utils/cms/talks'

export default defineEventHandler(async () => {
  const upcomingConferences = await getUpcomingTalks()

  return Promise.all(
    upcomingConferences.map(async conference => {
      conference.dates = formatConferenceDates(conference)
      delete conference.endDate

      if (conference.image?.url && conference.image.width && conference.image.height) {
        return conference as Omit<UpcomingConference, 'image'> & { image: NonNullable<UpcomingConference['image']> }
      }

      const imageUrl = conference.image?.url ?? await (async () => {
        const html = await $fetch(conference.link, { responseType: 'text' })
        return html.match(
          /<meta[^>]*property="og:image"[^>]*content="([^"]+)"|<meta[^>]*content="([^"]+)"[^>]*property="og:image"/,
        )?.[1] ?? null
      })()

      if (!imageUrl) {
        return {
          ...conference,
          image: {
            url: null,
            alt: '',
            width: null,
            height: null,
          },
        }
      }

      const res = await $fetch(imageUrl, { responseType: 'arrayBuffer' })
      const metadata = imageMeta(new Uint8Array(res))

      return {
        ...conference,
        image: {
          url: imageUrl,
          alt: conference.image?.alt || `Logo for ${conference.name}`,
          width: metadata.width,
          height: metadata.height,
        },
      }
    }),
  )
})
