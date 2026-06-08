import { listAdminRecords } from '../../../utils/admin/crud'
import { viewAma } from '../../../utils/admin/ama-record'
import type { DevRoeAma } from '#shared/lex'

export default defineEventHandler(async event => {
  const records = await listAdminRecords(event, 'dev.roe.ama', {
    sortBy: r => -new Date((r.value as DevRoeAma.Record).createdAt).getTime(),
  })
  return records.map(viewAma)
})
