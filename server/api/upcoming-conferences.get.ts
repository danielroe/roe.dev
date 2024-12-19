import { imageMeta } from 'image-meta'

const eventQuery = groq`
*[_type == 'event' && date > now()] {
  name,
  "dates": date,
  endDate,
  link,
  location,
  "image": image.asset->{
    "height": metadata.dimensions.height,
    "width": metadata.dimensions.width,
    url
  }
} | order(date)
`

interface Event {
  name: string
  dates: string
  endDate?: string
  link: string
  location: string
  image?: {
    url: string
    width: number
    height: number
  }
}

export default defineEventHandler(async event => {
  if (!import.meta.dev && !import.meta.prerender) return []

  const sanity = useSanity(event)

  const upcomingConferences = sanity.config.token ? await sanity.client.fetch<Event[]>(eventQuery) : []

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
      if (conference.image) {
        return conference as Omit<typeof conference, 'image'> & { image: NonNullable<typeof conference.image> }
      }
      const html = await $fetch<string>(conference.link)
      const ogImage = html.match(
        /<meta[^>]*property="og:image"[^>]*content="([^"]+)"|<meta[^>]*content="([^"]+)"[^>]*property="og:image"/,
      )?.[1]

      if (!ogImage) {
        return {
          ...conference,
          image: {
            url: null,
            width: null,
            height: null,
          },
        }
      }

      // if (import.meta.dev) {
      //   return {
      //     ...conference,
      //     image: {
      //       url: ogImage,
      //       width: 1200,
      //       height: 630,
      //     },
      //   }
      // }

      const res = await $fetch(ogImage!, { responseType: 'arrayBuffer' }) as ArrayBuffer
      const metadata = imageMeta(new Uint8Array(res))

      return {
        ...conference,
        image: {
          url: ogImage,
          width: metadata.width,
          height: metadata.height,
        },
      }
    }),
  )
})
