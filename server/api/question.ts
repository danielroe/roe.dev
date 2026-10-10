import { createError, defineEventHandler, readBody, useRuntimeConfig } from 'nuxt/server'
import { createAirspace, passwordSession } from 'airspace'
import type { Identity } from 'airspace'

import { sendPushoverNotification } from '../utils/pushover'
import { encrypt } from '../utils/admin/encryption'
import { collections } from '#shared/collections'

export default defineEventHandler(async event => {
  if (event.req.method === 'OPTIONS') return null
  if (event.req.method !== 'POST') {
    throw createError({ status: 405, statusText: 'HTTP method is not allowed.' })
  }

  const { question } = await readBody<{ question?: unknown }>(event)
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw createError({ status: 422, statusText: 'question is required' })
  }

  const config = useRuntimeConfig()

  const persist = process.env.NUXT_PDS_ENCRYPTION_KEY
    ? persistQuestion(question, config).catch(err => {
        console.error('[question] PDS write failed:', err)
      })
    : (console.error('[question] NUXT_PDS_ENCRYPTION_KEY is not configured; question will not be persisted.'), Promise.resolve())

  const notify = sendPushoverNotification({
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
