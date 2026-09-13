import { updateAdminRecord } from '../../../utils/admin/crud'

export default defineEventHandler(async event => {
  return updateAdminRecord(event, 'entities', getRouterParam(event, 'rkey'), await readBody(event))
})
