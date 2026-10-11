import { github } from 'forges/github'
import { fixtureFetch } from 'forges/testing'
import type { Fixture } from 'forges/testing'
import { describe, expect, it } from 'vitest'

import { fetchOrgIds, fetchSponsors, inviteCollaborator, isSponsor } from '../../server/utils/github'

const API = 'https://api.github.com'

function createProvider (responses: Record<string, Fixture['response']>) {
  const { fetch } = fixtureFetch([], responses)
  return github({ auth: { type: 'token', token: 'test' }, fetch }).create()
}

const viewer = { status: 200, body: { login: 'octocat', id: 583231, node_id: 'MDQ6VXNlcjU4MzIzMQ==', type: 'User' } }

function sponsors (...nodes: Array<{ id: string, databaseId: number }>): Fixture['response'] {
  return { status: 200, body: { data: { user: { sponsors: { nodes: nodes.map(node => ({ ...node, avatarUrl: '', name: null })) } } } } }
}

describe('sponsor check', () => {
  it('recognises a sponsor by the id that users.me() returns', async () => {
    const gh = createProvider({
      [`GET ${API}/user`]: viewer,
      [`POST ${API}/graphql Sponsors`]: sponsors({ id: 'MDQ6VXNlcjU4MzIzMQ==', databaseId: 583231 }),
    })

    const ids = (await fetchSponsors(gh, 'danielroe')).map(s => s.id)
    const me = await gh.users.me()

    expect(isSponsor(ids, [me.id])).toBe(true)
  })

  it('recognises a member of a sponsoring organisation', async () => {
    const gh = createProvider({
      [`GET ${API}/user/orgs?per_page=100`]: { status: 200, body: [{ id: 62017400, login: 'nuxtlabs' }] },
      [`POST ${API}/graphql Sponsors`]: sponsors({ id: 'MDEyOk9yZ2FuaXphdGlvbjYyMDE3NDAw', databaseId: 62017400 }),
    })

    const ids = (await fetchSponsors(gh, 'danielroe')).map(s => s.id)

    expect(isSponsor(ids, await fetchOrgIds(gh))).toBe(true)
  })

  it('does not recognise an account that is not a sponsor', async () => {
    const gh = createProvider({
      [`GET ${API}/user`]: viewer,
      [`POST ${API}/graphql Sponsors`]: sponsors({ id: 'MDQ6VXNlcjE=', databaseId: 1 }),
    })

    const ids = (await fetchSponsors(gh, 'danielroe')).map(s => s.id)
    const me = await gh.users.me()

    expect(isSponsor(ids, [me.id])).toBe(false)
  })
})

describe('repository invites', () => {
  const url = `PUT ${API}/repos/danielroe/secret/collaborators/octocat`

  it('sends a new collaborator to their invitation', async () => {
    const gh = createProvider({ [url]: { status: 201, body: { id: 1 } } })
    expect(await inviteCollaborator(gh, 'danielroe/secret', 'octocat')).toBe('https://github.com/danielroe/secret/invitations')
  })

  it('sends an account that already has access to the repository', async () => {
    const gh = createProvider({ [url]: { status: 204 } })
    expect(await inviteCollaborator(gh, 'danielroe/secret', 'octocat')).toBe('https://github.com/danielroe/secret')
  })

  it('sends the account to the invitations page when the invite fails', async () => {
    const gh = createProvider({ [url]: { status: 403, body: { message: 'Forbidden' } } })
    expect(await inviteCollaborator(gh, 'danielroe/secret', 'octocat')).toBe('https://github.com/danielroe/secret/invitations')
  })
})
