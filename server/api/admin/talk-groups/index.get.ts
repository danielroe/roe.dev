import { listAdminRecords } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return listAdminRecords(event, 'dev.roe.talkGroup', {
    sortBy: r => r.value.title,
  })
})
