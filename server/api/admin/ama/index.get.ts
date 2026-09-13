import { listAdminRecords } from '../../../utils/admin/crud'
import { viewAma } from '../../../utils/admin/ama-record'

export default defineEventHandler(async event => {
  return (await listAdminRecords(event, 'ama')).map(viewAma)
})
