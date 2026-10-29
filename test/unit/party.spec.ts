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

  it('stores the pad mode and broadcasts it to phones on every instance', async () => {
    const [a, b] = createInstances()
    const host = createPeer()
    const phone = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await b!.open(phone, url('cursors'))
    expect(phone.json().at(-1)).toEqual({ t: 'mode', mode: 'cursor', emojis: ['❤️', '👏', '🎉', '😂', '🤯', '🔥'] })

    const before = phone.messages.length
    await a!.message(host, JSON.stringify({ t: 'mode', mode: 'both', emojis: [' 🌮 ', 42, '', 'way too long for an emoji', '🌮', '🌶️'] }))
    await settle()
    expect(phone.json().at(-1)).toEqual({ t: 'mode', mode: 'both', emojis: ['🌮', '🌶️'] })
    expect(phone.messages.length).toBe(before + 1)

    await a!.message(host, JSON.stringify({ t: 'mode', mode: 'both', emojis: ['🌮', '🌶️'] }))
    await settle()
    expect(phone.messages.length).toBe(before + 1)
    expect(host.json().some(m => m.t === 'mode')).toBe(false)

    const next = createPeer()
    await a!.open(next, url('cursors'))
    expect(next.json()).toEqual([
      { t: 'scene', scene: null },
      { t: 'mode', mode: 'both', emojis: ['🌮', '🌶️'] },
    ])

    await a!.message(host, JSON.stringify({ t: 'mode', mode: 'nonsense', emojis: [] }))
    await settle()
    expect(phone.json().at(-1)).toEqual({ t: 'mode', mode: 'cursor', emojis: ['❤️', '👏', '🎉', '😂', '🤯', '🔥'] })
  })

  it('ignores mode changes from phones', async () => {
    const [a] = createInstances(1)
    const phone = createPeer()
    const fakeHost = createPeer()
    await a!.open(phone, url('cursors'))
    await a!.open(fakeHost, url('cursors', '?role=host&token=wrong'))
    await a!.message(phone, JSON.stringify({ t: 'mode', mode: 'react' }))
    await a!.message(fakeHost, JSON.stringify({ t: 'mode', mode: 'react' }))
    await settle()

    expect(phone.json().filter(m => m.t === 'mode')).toEqual([{ t: 'mode', mode: 'cursor', emojis: expect.any(Array) }])
    const next = createPeer()
    await a!.open(next, url('cursors'))
    expect(next.json().at(-1)).toMatchObject({ t: 'mode', mode: 'cursor' })
  })

  it.each(['react', 'both'])('relays reactions to hosts in %s mode', async mode => {
    const [a, b] = createInstances()
    const host = createPeer()
    const phone = createPeer()
    const other = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await b!.open(phone, url('cursors'))
    await b!.open(other, url('cursors'))
    await b!.message(phone, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    await a!.message(host, JSON.stringify({ t: 'mode', mode, emojis: ['🎉', '🔥'] }))
    await settle()

    await b!.message(phone, JSON.stringify({ t: 'react', emoji: '🎉' }))
    await b!.message(phone, JSON.stringify({ t: 'react', emoji: '❤️' }))
    await b!.message(phone, JSON.stringify({ t: 'react', emoji: 42 }))
    await settle()

    expect(host.json().filter(m => m.t === 'react')).toEqual([{ t: 'react', id: 'a-phone-identifier', emoji: '🎉' }])
    expect(other.json().some(m => m.t === 'react')).toBe(false)
  })

  it('drops reactions in cursor mode and from phones that have not said hello', async () => {
    const [a] = createInstances(1)
    const host = createPeer()
    const phone = createPeer()
    const anonymous = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await a!.open(phone, url('cursors'))
    await a!.open(anonymous, url('cursors'))
    await a!.message(phone, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    await a!.message(phone, JSON.stringify({ t: 'react', emoji: '🎉' }))

    await a!.message(host, JSON.stringify({ t: 'mode', mode: 'react' }))
    await a!.message(anonymous, JSON.stringify({ t: 'react', emoji: '🎉' }))
    await a!.message(host, JSON.stringify({ t: 'mode', mode: 'cursor' }))
    await a!.message(phone, JSON.stringify({ t: 'react', emoji: '🎉' }))
    await settle()

    expect(host.json().some(m => m.t === 'react')).toBe(false)
  })

  it('rate limits reactions per phone', async () => {
    const [a] = createInstances(1)
    const host = createPeer()
    const phone = createPeer()
    await a!.open(host, url('cursors', `?role=host&token=${TOKEN}`))
    await a!.open(phone, url('cursors'))
    await a!.message(phone, JSON.stringify({ t: 'hello', id: 'a-phone-identifier' }))
    await a!.message(host, JSON.stringify({ t: 'mode', mode: 'react' }))
    const reactions = () => host.json().filter(m => m.t === 'react').length

    for (let i = 0; i < 10; i++) await a!.message(phone, JSON.stringify({ t: 'react', emoji: '🔥' }))
    expect(reactions()).toBe(4)

    await vi.advanceTimersByTimeAsync(500)
    for (let i = 0; i < 10; i++) await a!.message(phone, JSON.stringify({ t: 'react', emoji: '🔥' }))
    expect(reactions()).toBe(6)

    await vi.advanceTimersByTimeAsync(5000)
    for (let i = 0; i < 10; i++) await a!.message(phone, JSON.stringify({ t: 'react', emoji: '🔥' }))
    expect(reactions()).toBe(10)
  })
})
