import { defineEventHandler, getRequestHeader, getRouterParam, readBody, setResponseStatus } from 'nuxt/server'

import { useParty } from '../../../utils/party'
import type { PartyRequest } from '../../../utils/party/server'

export default defineEventHandler(async event => {
  const body = await readBody<PartyRequest | null>(event).catch(() => null)
  const result = await (await useParty()).request(
    getRouterParam(event, 'room') || '',
    body && typeof body === 'object' ? body : {},
    getRequestHeader(event, 'authorization'),
  )
  setResponseStatus(event, result.status)
  return result.body ?? null
})
