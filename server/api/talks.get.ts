import { getPastTalks } from '../utils/cms/talks'

export default defineEventHandler(async event => {
  try {
    return await getPastTalks(event)
  }
  catch (error) {
    console.error('Failed to fetch talks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch talks',
    })
  }
})
