import { listAdminRecords } from '../../../utils/admin/crud'
import { decryptInvite } from '../../../utils/admin/invites'
import { dev } from '#shared/lex'

export default defineEventHandler(async event => {
  const records = await listAdminRecords(event, dev.roe.invite.main, {
    sortBy: r => -new Date((r.value as dev.roe.invite.Main).createdAt).getTime(),
  })
  return records.map(decryptInvite)
})
