import { defineEventHandler } from 'nuxt/server'

import { getProjects } from '../utils/cms/projects'

export default defineEventHandler(async () => {
  return getProjects()
})
