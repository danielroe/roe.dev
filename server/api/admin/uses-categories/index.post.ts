import { createAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.usesCategory.Main, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, dev.roe.usesCategory.main, body)
})
