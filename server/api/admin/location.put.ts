import { createAdminRecord } from '../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.location.Main, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, dev.roe.location.main, body, 'self')
})
