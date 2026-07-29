import { getPastTalks } from '../utils/cms/talks'
import type { Talk } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<Talk[]> => {
  try {
    return await getPastTalks(event)
  }
  catch (error) {
    console.error('Failed to fetch talks:', error)
    throw createError({
      status: 500,
      message: 'Failed to fetch talks',
    })
  }
})
