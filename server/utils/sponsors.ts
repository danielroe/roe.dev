import { useRuntimeConfig } from 'nuxt/server'

import { query } from './github'

interface Sponsor {
  id: string
  avatarUrl?: string
  name?: string
}

/** Reused across requests in development only. */
let devSponsors: Sponsor[] | undefined

export async function getSponsors (): Promise<Sponsor[]> {
  const token = useRuntimeConfig().github.token
  if (!token) return []
  if (import.meta.dev && devSponsors) return devSponsors

  const sponsors: Sponsor[] = await query(
    token,
    sponsorQuery,
  ).then(r => r?.user.sponsors.edges.map((e: any) => e.node) || [])

  // my ID
  sponsors.push({ id: useRuntimeConfig().github.id })

  // NuxtLabs
  sponsors.unshift({
    name: 'Vercel',
    id: 'MDEyOk9yZ2FuaXphdGlvbjE0OTg1MDIw',
    avatarUrl: 'https://avatars.githubusercontent.com/u/14985020?v=4',
  },
  {
    name: 'NuxtLabs',
    id: 'MDEyOk9yZ2FuaXphdGlvbjYyMDE3NDAw',
    avatarUrl: 'https://avatars.githubusercontent.com/u/62017400?v=4',
  })

  if (import.meta.dev) devSponsors = sponsors
  return sponsors
}

const sponsorQuery = /* graqhql */ `
{
  user(login: "danielroe") {
    sponsors(first: 100) {
      edges {
        node {
          ... on User {
            id
            avatarUrl
            name
          }
           ... on Organization {
             id
             avatarUrl
             name
           }
        }
      }
    }
  }
}`
