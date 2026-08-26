import { getProjects } from '../utils/cms/projects'

export default defineEventHandler(async event => {
  return getProjects(event)
})
