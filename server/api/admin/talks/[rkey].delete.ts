import { deleteAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return deleteAdminRecord(event, 'dev.roe.talk', getRouterParam(event, 'rkey'))
})
