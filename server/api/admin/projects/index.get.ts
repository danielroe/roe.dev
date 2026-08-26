import { listAdminRecords } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(event => {
  return listAdminRecords(event, dev.roe.project.main, {
    sortBy: r => r.value.order ?? 100,
  })
})
