import { getAdminRecord } from '../../utils/admin/crud'

export default defineEventHandler(async event => {
  try {
    return await getAdminRecord(event, 'dev.roe.location', 'self')
  }
  catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
      return null
    }
    throw err
  }
})
