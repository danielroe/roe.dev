import { createError, defineEventHandler } from 'nuxt/server'

import { getPastTalks } from '../utils/cms/talks'

export default defineEventHandler(async () => {
  try {
    return await getPastTalks()
  }
  catch (error) {
    console.error('Failed to fetch talks:', error)
    throw createError({
      status: 500,
      statusText: 'Failed to fetch talks',
    })
  }
})
