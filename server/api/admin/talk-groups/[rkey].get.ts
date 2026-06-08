import { getAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return getAdminRecord(event, 'dev.roe.talkGroup', getRouterParam(event, 'rkey'))
})
