import { createAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.usesItem.Main, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, dev.roe.usesItem.main, body)
})
