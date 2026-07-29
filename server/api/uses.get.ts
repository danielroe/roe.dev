import { getUses } from '../utils/cms/uses'
import type { UsesCategory } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<UsesCategory[]> => {
  return getUses(event)
})
