import { repoRef } from 'forges'
import type { RepoRef } from 'forges'
import { github } from 'forges/github'
import type { GitHubProvider } from 'forges/github'

export const SLIDES_REPO: RepoRef = { forge: 'github', instance: 'github.com', owner: 'danielroe', name: 'slides' }

export interface Sponsor {
  id: string
  avatarUrl?: string
  name?: string
}

export function createGitHub (token: string): GitHubProvider {
  return github({
    auth: { type: 'token', token },
    userAgent: 'roe (https://roe.dev, 0.1)',
  }).create()
}

export async function downloadSlides (gh: GitHubProvider, tag: string): Promise<Uint8Array | undefined> {
  const release = await gh.releases.getByTag(SLIDES_REPO, tag)
  const asset = release.assets?.find(a => a.name.endsWith('.pdf'))?.ref
  if (!asset) return
  return gh.releases.downloadAsset(asset, { as: 'binary' })
}

export async function fetchSponsors (gh: GitHubProvider, login: string): Promise<Sponsor[]> {
  const data = await gh.graphql<SponsorsResponse>(sponsorQuery, { login })
  return data.user.sponsors.nodes.map(node => ({
    id: String(node.databaseId),
    avatarUrl: node.avatarUrl,
    name: node.name ?? undefined,
  }))
}

export async function fetchOrgIds (gh: GitHubProvider): Promise<string[]> {
  const { data } = await gh.request<Array<{ id: number }>>('GET', '/user/orgs', { query: { per_page: 100 } })
  return data.map(org => String(org.id))
}

export function isSponsor (sponsorIds: string[], accountIds: string[]): boolean {
  return accountIds.some(id => sponsorIds.includes(id))
}

/** Gives `login` write access to `repo` and returns where to send them: the repository, or their pending invitation. */
export async function inviteCollaborator (gh: GitHubProvider, repo: string, login: string): Promise<string> {
  const result = await gh.repos.addCollaborator(repoRef(gh, repo), login, 'write')
    .catch(err => console.log('could not add collaborator', err))
  return `https://github.com/${repo}${result?.status === 'added' ? '' : '/invitations'}`
}

interface SponsorsResponse {
  user: {
    sponsors: {
      nodes: Array<{ databaseId: number, avatarUrl: string, name: string | null }>
    }
  }
}

const sponsorQuery = /* graphql */ `
query Sponsors($login: String!) {
  user(login: $login) {
    sponsors(first: 100) {
      nodes {
        ... on User {
          databaseId
          avatarUrl
          name
        }
        ... on Organization {
          databaseId
          avatarUrl
          name
        }
      }
    }
  }
}`
