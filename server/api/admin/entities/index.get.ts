import { listAdminRecords } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return listAdminRecords(event, 'dev.roe.entity', {
    sortBy: r => r.value.name,
  })
})
