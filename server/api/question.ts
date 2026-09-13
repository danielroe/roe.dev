import { createAirspace, passwordSession } from 'airspace'
import type { Identity } from 'airspace'

import { sendPushoverNotification } from '../utils/pushover'
import { encrypt } from '../utils/admin/encryption'
import { collections } from '#shared/collections'

export default defineEventHandler(async event => {
  if (event.method === 'OPTIONS') return null
  assertMethod(event, 'POST')

  const { question } = await readBody(event)
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw createError({ statusCode: 422, statusMessage: 'question is required' })
  }

  const config = useRuntimeConfig(event)

  const persist = process.env.NUXT_PDS_ENCRYPTION_KEY
    ? persistQuestion(question, config).catch(err => {
        console.error('[question] PDS write failed:', err)
      })
    : (console.error('[question] NUXT_PDS_ENCRYPTION_KEY is not configured; question will not be persisted.'), Promise.resolve())

  const notify = sendPushoverNotification(event, {
    title: 'Anonymous question',
    message: question,
    priority: 0,
  })

  await Promise.all([persist, notify])
  return null
})

/**
 * Questions arrive from anonymous visitors, so this writes with the site's own
 * app password rather than the editor's OAuth session.
 */
async function persistQuestion (question: string, config: ReturnType<typeof useRuntimeConfig>) {
  const service = config.public.atproto.service
  const airspace = createAirspace({
    identity: { did: config.atproto.did as Identity['did'], service },
    collections: { ama: collections.ama },
    session: await passwordSession({
      service,
      identifier: config.atproto.handle,
      password: config.atproto.password,
    }),
  })
  await airspace.ama.create({
    status: 'unanswered',
    encryptedQuestion: encrypt(question),
    createdAt: new Date().toISOString(),
  })
}
