import { getAdminRecord } from '../../../utils/admin/crud'
import { decryptInvite } from '../../../utils/admin/invites'

export default defineEventHandler(async event => {
  const r = await getAdminRecord(event, 'dev.roe.invite', getRouterParam(event, 'rkey'))
  return decryptInvite(r)
})
