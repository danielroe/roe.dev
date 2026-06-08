import { listAdminRecords } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return listAdminRecords(event, 'dev.roe.talk', {
    sortBy: r => r.value.date ?? '',
  }).then(rs => rs.reverse())
})
