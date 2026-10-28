import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createParty } from '../../server/utils/party/server'
import type { PartyPeer } from '../../server/utils/party/server'
import { createMemoryStore } from '../../server/utils/party/store'

const TOKEN = 'secret'

function createInstances (count = 2) {
  const store = createMemoryStore()
  return Array.from({ length: count }, () => createParty({ store, authorise: token => token === TOKEN }))
}

let peerId = 0
function createPeer () {
  const peer = {
    id: `peer-${++peerId}`,
    messages: [] as string[],
    closed: undefined as number | undefined,
    send (data: string) {
      peer.messages.push(data)
    },
    close (code?: number) {
      peer.closed = code
    },
    json () {
      return peer.messages.filter(m => m.startsWith('{')).map(m => JSON.parse(m))
    },
  } satisfies PartyPeer & Record<string, unknown>
  return peer
}

const url = (room: string, query = '') => new URL(`http://localhost/parties/main/${room}${query}`)
const settle = () => vi.advanceTimersByTimeAsync(50)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('party rooms', () => {
  it('broadcasts votes to connections on every instance', async () => {
    const [a, b] = createInstances()
    const first = createPeer()
    const second = createPeer()
    await a!.open(first, url('talk'))
    await b!.open(second, url('talk'))

    expect(await b!.request('talk', { type: 'vote' })).toEqual({ status: 204 })
    await settle()

    expect(first.messages).toContain('count:1')
    expect(second.messages).toContain('count:1')
    expect(second.messages).toContain('status:default')
  })

  it('counts connections across instances', async () => {
    const [a, b] = createInstances()
    const first = createPeer()
    const second = createPeer()
    await a!.open(first, url('site'))
    await b!.open(second, url('site'))
    await settle()
    expect(first.messages.at(-1)).toBe('connections:2')

    await b!.close(second)
    await settle()
    expect(first.messages.at(-1)).toBe('connections:1')
  })

  it('only lets hosts clear a room', async () => {
    const [a, b] = createInstances()
    const guest = createPeer()
    const host = createPeer()
    await a!.open(guest, url('feedback'))
    await b!.open(host, url('feedback', `?token=${TOKEN}`))
    await a!.request('feedback', { type: 'feedback', status: 'great talk' })
    await settle()
    expect(host.messages.at(-1)).toBe('feedback:["great talk"]')

    await a!.message(guest, 'clear')
    await settle()
    expect(host.messages.at(-1)).toBe('feedback:["great talk"]')

    await b!.message(host, 'clear')
    await settle()
    expect(guest.messages.at(-1)).toBe('feedback:[]')
  })

  it('requires the token to set live status', async () => {
    const [a] = createInstances(1)
    expect(await a!.request('site', { status: 'live' })).toMatchObject({ status: 401 })
    expect(await a!.request('site', { status: 'live' }, TOKEN)).toEqual({ status: 204 })

    const peer = createPeer()
    await a!.open(peer, url('site'))
    expect(peer.messages).toContain('status:live')
  })

  it('relays phone cursors to hosts on other instances', async () => {
    const [a, b] = createInstances()
    const host = createPeer()
    const phone = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await b!.open(phone, url('cursors', '?role=phone'))
    await b!.message(phone, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    await b!.message(phone, JSON.stringify({ t: 'p', x: 0.25, y: 2 }))
    await settle()

    const you = phone.json().find(m => m.t === 'you')
    expect(you).toMatchObject({ id: 'a-phone-identifier', name: 'Brave Otter', x: 0.5, y: 0.5 })
    expect(host.json()).toEqual([
      { t: 'sync', cursors: [] },
      { t: 'scene', scene: null },
      { ...you, t: 'join' },
      { t: 'p', id: 'a-phone-identifier', x: 0.25, y: 1 },
    ])

    await b!.close(phone)
    await settle()
    expect(host.json().at(-1)).toEqual({ t: 'leave', id: 'a-phone-identifier' })
  })

  it('themes new cursor names from the host', async () => {
    const [a, b] = createInstances()
    const host = createPeer()
    const phone = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await b!.open(phone, url('cursors'))

    await a!.message(host, JSON.stringify({ t: 'names', adjectives: [' Brave ', 42, ''], nouns: ['Ajolote', 'Quetzal'] }))
    await b!.message(phone, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))

    expect(phone.json().find(m => m.t === 'you')).toMatchObject({ id: 'a-phone-identifier', name: 'Brave Ajolote' })
  })

  it('ignores name lists from phones and keeps them through clear', async () => {
    const [a] = createInstances(1)
    const host = createPeer()
    const phone = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await a!.open(phone, url('cursors'))

    await a!.message(host, JSON.stringify({ t: 'names', adjectives: ['Brave', 'Sleepy'], nouns: ['Ajolote', 'Quetzal'] }))
    await a!.message(phone, JSON.stringify({ t: 'names', adjectives: ['Nope'], nouns: ['Nope'] }))
    await a!.message(phone, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    expect(phone.json().find(m => m.t === 'you')).toMatchObject({ name: 'Brave Ajolote' })

    await a!.message(host, JSON.stringify({ t: 'clear' }))
    expect(phone.closed).toBe(4000)

    const next = createPeer()
    await a!.open(next, url('cursors'))
    await a!.message(next, JSON.stringify({ t: 'hello', id: 'next-phone-identifier' }))
    expect(next.json().find(m => m.t === 'you')).toMatchObject({ name: 'Brave Ajolote' })
  })

  it('keeps a cursor online while it is still connected to another instance', async () => {
    const [a, b] = createInstances()
    const host = createPeer()
    const oldTab = createPeer()
    const newTab = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await a!.open(oldTab, url('cursors'))
    await b!.open(newTab, url('cursors'))
    await a!.message(oldTab, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    await b!.message(newTab, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    await a!.close(oldTab)
    await settle()

    expect(host.json().at(-1)).toMatchObject({ t: 'join', id: 'a-phone-identifier' })
  })

  it('ignores host messages from phones and clears phones on every instance', async () => {
    const [a, b] = createInstances()
    const host = createPeer()
    const phone = createPeer()
    await a!.open(host, url('cursors', '?role=host&token=wrong'))
    await b!.open(phone, url('cursors'))
    await b!.message(phone, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    await a!.message(host, JSON.stringify({ t: 'clear' }))
    await settle()
    expect(phone.closed).toBeUndefined()

    const realHost = createPeer()
    await a!.open(realHost, url('cursors', `?role=host&token=${TOKEN}`))
    await a!.message(realHost, JSON.stringify({ t: 'clear' }))
    await settle()
    expect(phone.closed).toBe(4000)
    expect(realHost.json().at(-1)).toEqual({ t: 'sync', cursors: [] })
  })
})
