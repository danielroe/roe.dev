import { Client, currentDatetimeString } from '@atproto/lex'
import { PasswordSession } from '@atproto/lex-password-session'

import { sendPushoverNotification } from '../utils/pushover'
import { encrypt } from '../utils/admin/encryption'
import { dev } from '#shared/lex'

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

async function persistQuestion (question: string, config: ReturnType<typeof useRuntimeConfig>) {
  const session = await PasswordSession.login({
    service: config.public.atproto.service,
    identifier: config.atproto.handle,
    password: config.atproto.password,
  })
  await new Client(session).create(dev.roe.ama.main, {
    status: 'unanswered',
    encryptedQuestion: encrypt(question),
    createdAt: currentDatetimeString(),
  }, { validateRequest: true })
}
