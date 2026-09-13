import { invalidatePublicReads, requireAdminAirspace } from '../../utils/airspace'
import { collections } from '#shared/collections'

export default defineEventHandler(async event => {
  const airspace = await requireAdminAirspace(event)
  const result = await airspace.location.put(await readBody(event))
  invalidatePublicReads(collections.location.nsid)
  return result
})
