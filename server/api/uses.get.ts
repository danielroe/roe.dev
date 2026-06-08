import { getUses } from '../utils/cms/uses'

export default defineEventHandler(async event => {
  return getUses(event)
})
