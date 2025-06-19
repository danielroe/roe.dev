import { sendPushoverNotification } from '../utils/pushover'

export default defineEventHandler(async event => {
  if (event.method === 'OPTIONS') return null
  const sanity = useSanity(event)

  assertMethod(event, 'POST')
  const { question } = await readBody(event)
  if (!question) throw createError({ statusCode: 422 })

  event.waitUntil(sanity.client.create({
    _type: 'ama',
    content: question,
    publishStatus: 'draft',
    platforms: {
      bluesky: true,
      linkedin: true,
      mastodon: true,
      tiktok: true,
      tiktokStories: false,
    },
  }).catch(console.error))

  await sendPushoverNotification(event, {
    title: 'Anonymous question',
    message: question,
    priority: 0,
  })
  return null
})
