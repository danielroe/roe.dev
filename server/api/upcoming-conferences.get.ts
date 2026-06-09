import { imageMeta } from 'image-meta'

import { getUpcomingTalks } from '../utils/cms/talks'
import type { UpcomingConference } from '../utils/cms/talks'

export default defineEventHandler(async event => {
  const upcomingConferences = await getUpcomingTalks(event)

  const formatter = new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
  })

  return Promise.all(
    upcomingConferences.map(async conference => {
      let dates = formatter.format(new Date(conference.dates))
      if (conference.endDate) {
        dates += ` - ${formatter.format(new Date(conference.endDate))}`
        delete conference.endDate
      }
      conference.dates = dates

      if (conference.image?.url && conference.image.width && conference.image.height) {
        return conference as Omit<UpcomingConference, 'image'> & { image: NonNullable<UpcomingConference['image']> }
      }

      const imageUrl = conference.image?.url ?? await (async () => {
        const html = await $fetch<string>(conference.link)
        return html.match(
          /<meta[^>]*property="og:image"[^>]*content="([^"]+)"|<meta[^>]*content="([^"]+)"[^>]*property="og:image"/,
        )?.[1] ?? null
      })()

      if (!imageUrl) {
        return {
          ...conference,
          image: {
            url: null,
            width: null,
            height: null,
          },
        }
      }

      const res = await $fetch<ArrayBuffer>(imageUrl, { responseType: 'arrayBuffer' })
      const metadata = imageMeta(new Uint8Array(res))

      return {
        ...conference,
        image: {
          url: imageUrl,
          width: metadata.width,
          height: metadata.height,
        },
      }
    }),
  )
})
