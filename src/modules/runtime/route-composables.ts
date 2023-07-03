import type { Router } from '#vue-router'

/*! @__NO_SIDE_EFFECTS__ */
export const definePageMeta = (_args: any) => {}

export const useRoute = (_path?: string) =>
  useNuxtApp().$router as any as Router
