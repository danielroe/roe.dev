import type { H3Event } from 'h3'
import { query } from './github'

interface Sponsor {
  id: string
  avatarUrl?: string
  name?: string
}

interface CacheEntry {
  value: Sponsor[]
}

export async function getSponsors (event: H3Event): Promise<Sponsor[]> {
  const token = useRuntimeConfig(event).github.token
  if (!token) return []
  const entry: CacheEntry = ((await useStorage().getItem('sponsors')) as any) || {}

  if (!entry.value || !import.meta.dev) {
    entry.value = await query(
      token,
      sponsorQuery,
    ).then(r => r?.user.sponsors.edges.map((e: any) => e.node) || [])

    // my ID
    entry.value.push({ id: useRuntimeConfig(event).github.id })

    // NuxtLabs
    entry.value.unshift({
      name: 'Vercel',
      id: 'MDEyOk9yZ2FuaXphdGlvbjE0OTg1MDIw',
      avatarUrl: 'https://avatars.githubusercontent.com/u/14985020?v=4',
    },
    {
      name: 'NuxtLabs',
      id: 'MDEyOk9yZ2FuaXphdGlvbjYyMDE3NDAw',
      avatarUrl: 'https://avatars.githubusercontent.com/u/62017400?v=4',
    })

    useStorage()
      .setItem('sponsors', entry)
      .catch((error: any) => console.error('[nitro] [cache]', error))
  }

  return entry.value
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
