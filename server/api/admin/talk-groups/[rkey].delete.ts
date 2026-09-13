import { deleteAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(event => {
  return deleteAdminRecord(event, 'talkGroups', getRouterParam(event, 'rkey'))
})
