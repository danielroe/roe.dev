import { listAdminRecords } from '../../../utils/admin/crud'
import { dev } from '#shared/lex'

export default defineEventHandler(event => {
  return listAdminRecords(event, dev.roe.talk.main, {
    sortBy: r => r.value.date ?? '',
  }).then(rs => rs.reverse())
})
