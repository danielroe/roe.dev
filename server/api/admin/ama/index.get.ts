import { listAdminRecords } from '../../../utils/admin/crud'
import { viewAma } from '../../../utils/admin/ama-record'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const records = await listAdminRecords(event, dev.roe.ama.main, {
    sortBy: r => -new Date((r.value as dev.roe.ama.Main).createdAt).getTime(),
  })
  return records.map(viewAma)
})
