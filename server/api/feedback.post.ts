import { createError, defineEventHandler, readBody } from 'nuxt/server'

import { useParty } from '../utils/party'

export default defineEventHandler(async event => {
  const { feedback } = await readBody<{ feedback?: string }>(event)
  if (!feedback) {
    throw createError({ status: 400, statusText: 'Missing feedback' })
  }
  await (await useParty()).request('feedback', { type: 'feedback', status: feedback })
  return null
})
