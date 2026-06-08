import { getAdminRecord } from '../../../utils/admin/crud'
import { viewAma } from '../../../utils/admin/ama-record'

export default defineEventHandler(async event => {
  const r = await getAdminRecord(event, 'dev.roe.ama', getRouterParam(event, 'rkey'))
  return viewAma(r)
})
