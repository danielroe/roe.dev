import { listAdminRecords } from '../../../utils/admin/crud'
import { decryptInvite } from '../../../utils/admin/invites'

export default defineEventHandler(async event => {
  return (await listAdminRecords(event, 'invites')).map(decryptInvite)
})
