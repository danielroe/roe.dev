import { getAdminRecord } from '../../../utils/admin/crud'
import { decryptInvite } from '../../../utils/admin/invites'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const r = await getAdminRecord(event, dev.roe.invite.main, getRouterParam(event, 'rkey'))
  return decryptInvite(r)
})
