import { imageMeta } from 'image-meta'

import { getUpcomingTalks } from '../utils/cms/talks'
import type { UpcomingTalk } from '../utils/cms/talks'
import type { UpcomingConference, UpcomingConferenceImage } from '#shared/types/api'

const OG_IMAGE_RE = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"|<meta[^>]*content="([^"]+)"[^>]*property="og:image"/

export default defineEventHandler(async (event): Promise<UpcomingConference[]> => {
  const upcoming = await getUpcomingTalks(event)

  const formatter = new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
  })

  return Promise.all(
    upcoming.map(async ({ endDate, image, ...talk }): Promise<UpcomingConference> => {
      let dates = formatter.format(new Date(talk.dates))
      if (endDate) {
        dates += ` - ${formatter.format(new Date(endDate))}`
      }

      return { ...talk, dates, image: await resolveImage(image, talk.link) }
    }),
  )
})

async function resolveImage (
  image: UpcomingTalk['image'],
  link: string,
): Promise<UpcomingConferenceImage> {
  if (image?.url && image.width && image.height) return image

  const url = image?.url ?? await (async () => {
    const html = await $fetch<string>(link)
    return html.match(OG_IMAGE_RE)?.[1] ?? null
  })()

  if (!url) return { url: null, width: null, height: null }

  const res = await $fetch<ArrayBuffer>(url, { responseType: 'arrayBuffer' })
  const { width, height } = imageMeta(new Uint8Array(res))
  return { url, width, height }
}
