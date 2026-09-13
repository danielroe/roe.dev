import { getAdminRecord } from '../../../utils/admin/crud'
import { decryptInvite } from '../../../utils/admin/invites'

export default defineEventHandler(async event => {
  return decryptInvite(await getAdminRecord(event, 'invites', getRouterParam(event, 'rkey')))
})
