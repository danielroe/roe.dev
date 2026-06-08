import { listAdminRecords } from '../../../utils/admin/crud'
import { decryptInvite } from '../../../utils/admin/invites'
import type { DevRoeInvite } from '#shared/lex'

export default defineEventHandler(async event => {
  const records = await listAdminRecords(event, 'dev.roe.invite', {
    sortBy: r => -new Date((r.value as DevRoeInvite.Record).createdAt).getTime(),
  })
  return records.map(decryptInvite)
})
