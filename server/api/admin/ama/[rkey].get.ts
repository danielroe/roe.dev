import { getAdminRecord } from '../../../utils/admin/crud'
import { viewAma } from '../../../utils/admin/ama-record'

export default defineEventHandler(async event => {
  return viewAma(await getAdminRecord(event, 'ama', getRouterParam(event, 'rkey')))
})
