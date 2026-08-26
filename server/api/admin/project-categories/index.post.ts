import { createAdminRecord } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const body = await readBody<Omit<dev.roe.projectCategory.Main, '$type' | 'createdAt'>>(event)
  return createAdminRecord(event, dev.roe.projectCategory.main, body)
})
