import { listAdminRecords } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return listAdminRecords(event, 'dev.roe.usesItem', {
    sortBy: r => r.value.order ?? 100,
  })
})
