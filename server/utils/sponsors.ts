import { useRuntimeConfig } from 'nuxt/server'

import { createGitHub, fetchSponsors } from './github'
import type { Sponsor } from './github'

/** Reused across requests in development only. */
let devSponsors: Sponsor[] | undefined

export async function getSponsors (): Promise<Sponsor[]> {
  const token = useRuntimeConfig().github.token
  if (!token) return []
  if (import.meta.dev && devSponsors) return devSponsors

  const sponsors = await fetchSponsors(createGitHub(token), 'danielroe')

  // my ID
  sponsors.push({ id: useRuntimeConfig().github.id })

  // NuxtLabs
  sponsors.unshift({
    name: 'Vercel',
    id: '14985020',
    avatarUrl: 'https://avatars.githubusercontent.com/u/14985020?v=4',
  },
  {
    name: 'NuxtLabs',
    id: '62017400',
    avatarUrl: 'https://avatars.githubusercontent.com/u/62017400?v=4',
  })

  if (import.meta.dev) devSponsors = sponsors
  return sponsors
}
