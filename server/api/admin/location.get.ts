import { getAdminRecord } from '../../utils/admin/crud'

export default defineEventHandler(async event => {
  try {
    return await getAdminRecord(event, 'dev.roe.location', 'self')
  }
  catch (err) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
})
