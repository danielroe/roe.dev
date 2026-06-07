import { TID } from '@atproto/common-web'
import { AtpAgent } from '@atproto/api'

import { sendPushoverNotification } from '../utils/pushover'
import { encrypt } from '../utils/admin/encryption'
import { lexicons } from '#shared/lex'
import type { DevRoeAma } from '#shared/lex'

export default defineEventHandler(async event => {
  if (event.method === 'OPTIONS') return null
  assertMethod(event, 'POST')

  const { question } = await readBody(event)
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw createError({ statusCode: 422, statusMessage: 'question is required' })
  }

  const config = useRuntimeConfig(event)
  if (process.env.NUXT_PDS_ENCRYPTION_KEY) {
    event.waitUntil(persistQuestion(question, config).catch(err => console.error('[question] PDS write failed:', err)))
  }
  else {
    console.error('[question] NUXT_PDS_ENCRYPTION_KEY is not configured; question will not be persisted.')
  }

  await sendPushoverNotification(event, {
    title: 'Anonymous question',
    message: question,
    priority: 0,
  })
  return null
})

async function persistQuestion (question: string, config: ReturnType<typeof useRuntimeConfig>) {
  const record: DevRoeAma.Record = {
    $type: 'dev.roe.ama',
    status: 'unanswered',
    encryptedQuestion: encrypt(question),
    createdAt: new Date().toISOString(),
  }
  const validation = lexicons.validate('dev.roe.ama', record)
  if (!validation.success) throw new Error(validation.error.message)

  const agent = new AtpAgent({ service: config.public.atproto.service })
  await agent.login({ identifier: config.atproto.handle, password: config.atproto.password })
  await agent.com.atproto.repo.putRecord({
    repo: agent.session!.did,
    collection: 'dev.roe.ama',
    rkey: TID.nextStr(),
    record: record as Record<string, unknown>,
  })
}
