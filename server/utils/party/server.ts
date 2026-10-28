import { isValidEmoji } from '../../../shared/utils/emoji'
import type { PartyStore } from './store'

export interface PartyPeer {
  readonly id: string
  send (data: string): unknown
  close (code?: number, reason?: string): void
}

export interface PartyOptions {
  store: PartyStore
  /** Whether a token grants host access: clearing rooms, driving the cursors scene. */
  authorise: (token: string | null | undefined) => boolean
  /** Namespaces keys and channels, so environments can share a database. */
  prefix?: string
}

export interface PartyRequest {
  type?: 'vote' | 'status' | 'feedback' | 'reaction'
  status?: string
  emoji?: string
}

interface Cursor {
  id: string
  name: string
  color: string
  x: number
  y: number
}

interface Zone {
  id: string
  label: string
  color: string
  x: number
  y: number
  w: number
  h: number
}

interface Scene {
  title?: string
  zones: Zone[]
}

interface Conn {
  peer: PartyPeer
  room: Room
  host: boolean
  /** Cursor id, for phones in the cursors room. */
  id?: string
  queue: Promise<void>
}

type Envelope
  = | { to?: 'host' | 'phone', ms: string[] }
    | { c: 'reset' | 'clear' }
    | { c: 'leave', id: string }

const ROOM_RE = /^[\w-]{1,64}$/

const HEARTBEAT_INTERVAL = 30_000
const STALE_AFTER = 75_000
const BROADCAST_INTERVAL = 33
const PERSIST_INTERVAL = 1000

const ADJECTIVES = ['Brave', 'Sleepy', 'Jolly', 'Sneaky', 'Fuzzy', 'Clever', 'Bouncy', 'Cosy', 'Zippy', 'Plucky', 'Witty', 'Sunny', 'Mighty', 'Curious', 'Dapper', 'Nimble', 'Gentle', 'Merry', 'Bold', 'Quirky']
const NOUNS = ['Knedlík', 'Trdelník', 'Golem', 'Krtek', 'Pivo', 'Koláček', 'Rohlík', 'Vltava', 'Klobása', 'Švejk', 'Beaver', 'Otter', 'Lynx', 'Heron', 'Badger', 'Hedgehog', 'Stork', 'Marten', 'Owl', 'Carp']
const COLORS = ['#ff5d8f', '#ffb347', '#ffe156', '#8ce99a', '#38d9a9', '#4dabf7', '#748ffc', '#b197fc', '#f783ac', '#ff8787', '#63e6be', '#74c0fc', '#ffa94d', '#d0bfff', '#a9e34b', '#66d9e8']

const clamp = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5

/**
 * Realtime rooms backed by a {@link PartyStore}, so connections to the same
 * room can be spread across server instances.
 */
export function createParty (options: PartyOptions) {
  const instance = crypto.randomUUID()
  const rooms = new Map<string, Room>()
  const conns = new Map<PartyPeer, Conn>()

  const getRoom = (name: string) => {
    let room = rooms.get(name)
    if (!room) {
      room = name === 'cursors' ? new CursorsRoom(name, instance, options) : new BasicRoom(name, instance, options)
      rooms.set(name, room)
    }
    return room
  }

  const enqueue = (conn: Conn, task: () => unknown) => {
    conn.queue = conn.queue.then(task).then(() => {}, err => console.error('[party]', err))
    return conn.queue
  }

  return {
    /** Accepts a connection to `/parties/:party/:room`. */
    open (peer: PartyPeer, url: URL) {
      const name = url.pathname.split('/').filter(Boolean).pop()
      if (!name || !ROOM_RE.test(name)) {
        peer.close(1008, 'Invalid room')
        return Promise.resolve()
      }
      const room = getRoom(name)
      const conn: Conn = { peer, room, host: false, queue: Promise.resolve() }
      conns.set(peer, conn)
      room.attach(conn)
      return enqueue(conn, () => room.join(conn, url.searchParams))
    },
    message (peer: PartyPeer, text: string) {
      const conn = conns.get(peer)
      if (!conn || text.length > 20_000) return Promise.resolve()
      return enqueue(conn, () => conn.room.message(conn, text))
    },
    close (peer: PartyPeer) {
      const conn = conns.get(peer)
      if (!conn) return Promise.resolve()
      conns.delete(peer)
      return enqueue(conn, async () => {
        await conn.room.leave(conn)
        if (conn.room.detach(conn)) rooms.delete(conn.room.name)
      })
    },
    /** Handles a one-off HTTP submission to a room. */
    async request (name: string, body: PartyRequest, authorization?: string | null): Promise<{ status: number, body?: string }> {
      if (!ROOM_RE.test(name) || name === 'cursors') return { status: 422, body: 'Invalid room' }
      const room = rooms.get(name) as BasicRoom | undefined ?? new BasicRoom(name, instance, options)
      return room.request(body, authorization)
    },
  }
}

export type Party = ReturnType<typeof createParty>

abstract class Room {
  readonly conns = new Set<Conn>()
  readonly store: PartyStore
  readonly channel: string
  unsubscribe?: () => void
  heartbeat?: ReturnType<typeof setInterval>

  constructor (readonly name: string, readonly instance: string, readonly options: PartyOptions) {
    this.store = options.store
    this.channel = this.key('events')
  }

  key (name: string) {
    return `${this.options.prefix ?? ''}party:${this.name}:${name}`
  }

  attach (conn: Conn) {
    this.conns.add(conn)
    if (this.conns.size > 1) return
    this.unsubscribe = this.store.subscribe(this.channel, raw => {
      const { o, ...envelope } = JSON.parse(raw) as Envelope & { o: string }
      if (o !== this.instance) this.deliver(envelope as Envelope)
    })
    this.heartbeat = setInterval(() => {
      this.beat().catch(err => console.error('[party]', err))
    }, HEARTBEAT_INTERVAL)
  }

  /** Returns whether the room has no connections left on this instance. */
  detach (conn: Conn) {
    this.conns.delete(conn)
    if (this.conns.size) return false
    this.unsubscribe?.()
    clearInterval(this.heartbeat)
    return true
  }

  /** Delivers to connections on this instance, then to every other instance. */
  async publish (envelope: Envelope) {
    this.deliver(envelope)
    await this.store.publish(this.channel, JSON.stringify({ ...envelope, o: this.instance }))
  }

  abstract join (conn: Conn, params: URLSearchParams): Promise<void>
  abstract message (conn: Conn, text: string): Promise<void>
  abstract leave (conn: Conn): Promise<void>
  abstract beat (): Promise<void>
  abstract deliver (envelope: Envelope): void
}

class BasicRoom extends Room {
  async join (conn: Conn, params: URLSearchParams) {
    conn.host = this.options.authorise(params.get('token'))
    await this.store.touch(this.key('conns'), [conn.peer.id], Date.now())
    const [count, status, feedback] = await Promise.all([
      this.store.get<number>(this.key('count')),
      this.store.get<string>(this.key('status')),
      this.name === 'feedback' ? this.store.list<string>(this.key('feedback')) : undefined,
    ])
    conn.peer.send(`count:${count || 0}`)
    if (feedback) conn.peer.send(`feedback:${JSON.stringify(feedback)}`)
    conn.peer.send(`status:${status || 'default'}`)
    await this.broadcastConnections()
  }

  async leave (conn: Conn) {
    if (await this.store.untouch(this.key('conns'), [conn.peer.id]).then(r => r.length)) {
      await this.broadcastConnections()
    }
  }

  async beat () {
    await this.store.touch(this.key('conns'), [...this.conns].map(c => c.peer.id), Date.now())
  }

  async broadcastConnections () {
    await this.store.prune(this.key('conns'), Date.now() - STALE_AFTER)
    const count = (await this.store.members(this.key('conns'))).length
    await this.publish({ ms: [`connections:${count}`] })
  }

  async message (conn: Conn, text: string) {
    if (text === 'clear') {
      if (!conn.host) return
      if (this.name === 'feedback') {
        await this.store.del(this.key('feedback'))
        await this.publish({ ms: ['feedback:[]'] })
      }
      else {
        await this.store.set(this.key('count'), 0)
        await this.publish({ ms: ['count:0'] })
      }
      return
    }

    if (this.name === 'reactions' && text.startsWith('reaction:') && isValidEmoji(text.slice('reaction:'.length))) {
      await this.publish({ ms: [text] })
    }
  }

  async request ({ status, emoji, type = status ? 'status' : (emoji ? 'reaction' : 'vote') }: PartyRequest, authorization?: string | null) {
    switch (type) {
      case 'vote': {
        const count = await this.store.incr(this.key('count'))
        await this.publish({ ms: [`count:${count}`] })
        return { status: 204 }
      }
      case 'feedback': {
        if (typeof status !== 'string' || !status) return { status: 422, body: 'Invalid feedback' }
        const feedback = await this.store.append(this.key('feedback'), status.slice(0, 2000))
        await this.publish({ ms: [`feedback:${JSON.stringify(feedback)}`] })
        return { status: 204 }
      }
      case 'status': {
        if (!status || !['live', 'default'].includes(status)) return { status: 422, body: 'Invalid status' }
        if (!this.options.authorise(authorization)) return { status: 401, body: 'Unauthorised' }
        await this.store.set(this.key('status'), status)
        await this.publish({ ms: [`status:${status}`] })
        return { status: 204 }
      }
    }
    return { status: 422, body: 'Invalid request' }
  }

  deliver (envelope: Envelope) {
    if (!('ms' in envelope)) return
    for (const conn of this.conns) {
      for (const m of envelope.ms) conn.peer.send(m)
    }
  }
}

interface LocalCursor {
  cursor: Cursor
  conns: Set<Conn>
}

class CursorsRoom extends Room {
  phones = new Map<string, LocalCursor>()
  pending = new Set<string>()
  dirty = new Set<string>()
  flushTimer?: ReturnType<typeof setTimeout>
  persistTimer?: ReturnType<typeof setTimeout>

  async join (conn: Conn, params: URLSearchParams) {
    conn.host = params.get('role') === 'host' && this.options.authorise(params.get('token'))
    const scene = await this.store.get<Scene>(this.key('scene'))
    if (conn.host) conn.peer.send(JSON.stringify({ t: 'sync', cursors: await this.onlineCursors() }))
    conn.peer.send(JSON.stringify({ t: 'scene', scene }))
  }

  async message (conn: Conn, text: string) {
    let msg: Record<string, any>
    try {
      msg = JSON.parse(text)
    }
    catch {
      return
    }
    if (!msg || typeof msg !== 'object') return

    if (conn.host) return this.onHostMessage(msg)

    switch (msg.t) {
      case 'hello':
        return this.hello(conn, msg)
      case 'p':
      case 'tap': {
        const local = conn.id ? this.phones.get(conn.id) : undefined
        if (!local) return
        local.cursor.x = clamp(msg.x)
        local.cursor.y = clamp(msg.y)
        this.persist(local.cursor.id)
        if (msg.t === 'p') {
          this.pending.add(local.cursor.id)
          this.schedule()
          return
        }
        this.pending.delete(local.cursor.id)
        await this.publish({ to: 'host', ms: [JSON.stringify({ t: 'tap', id: local.cursor.id, x: local.cursor.x, y: local.cursor.y })] })
      }
    }
  }

  async hello (conn: Conn, msg: Record<string, any>) {
    const id = typeof msg.id === 'string' && msg.id.length >= 16 && msg.id.length <= 64 ? msg.id : conn.peer.id
    if (conn.id && conn.id !== id) await this.leave(conn)
    conn.id = id

    let local = this.phones.get(id)
    let cursor = local?.cursor ?? await this.store.hget<Cursor>(this.key('cursors'), id)
    let changed = false
    if (!cursor) {
      const n = await this.store.incr(this.key('assigned')) - 1
      cursor = { id, name: makeName(n), color: COLORS[n % COLORS.length]!, x: 0.5, y: 0.5 }
      changed = true
    }
    if (typeof msg.name === 'string' && msg.name.trim()) {
      cursor.name = msg.name.trim().slice(0, 32)
      changed = true
    }
    if (changed) await this.store.hset(this.key('cursors'), { [id]: cursor })

    if (!local) this.phones.set(id, local = { cursor, conns: new Set() })
    local.conns.add(conn)
    conn.peer.send(JSON.stringify({ t: 'you', ...cursor }))
    if (local.conns.size === 1) await this.online(cursor)
  }

  async online (cursor: Cursor) {
    if (await this.store.touch(this.key('online'), [cursor.id], Date.now())) {
      await this.publish({ to: 'host', ms: [JSON.stringify({ t: 'join', ...cursor })] })
    }
  }

  async leave (conn: Conn) {
    const local = conn.id ? this.phones.get(conn.id) : undefined
    conn.id = undefined
    if (!local) return
    local.conns.delete(conn)
    if (local.conns.size) return
    const { id } = local.cursor
    this.phones.delete(id)
    this.pending.delete(id)
    await this.flushPersist()
    if ((await this.store.untouch(this.key('online'), [id])).length) {
      await this.publish({ c: 'leave', id })
    }
  }

  async beat () {
    const key = this.key('online')
    await this.store.touch(key, [...this.phones.keys()], Date.now())
    for (const id of await this.store.prune(key, Date.now() - STALE_AFTER)) {
      await this.publish({ c: 'leave', id })
    }
  }

  async onHostMessage (msg: Record<string, any>) {
    switch (msg.t) {
      case 'scene': {
        const scene = sanitiseScene(msg.scene)
        await this.store.set(this.key('scene'), scene)
        await this.publish({ ms: [JSON.stringify({ t: 'scene', scene })] })
        break
      }
      case 'result':
        await this.publish({ to: 'phone', ms: [JSON.stringify({ t: 'result', zoneId: typeof msg.zoneId === 'string' ? msg.zoneId : null })] })
        break
      case 'reset': {
        const cursors = await this.store.hgetall<Cursor>(this.key('cursors'))
        for (const cursor of Object.values(cursors)) {
          cursor.x = 0.5
          cursor.y = 0.5
        }
        await this.store.hset(this.key('cursors'), cursors)
        await this.publish({ c: 'reset' })
        break
      }
      case 'clear':
        await this.store.del(this.key('cursors'), this.key('assigned'), this.key('online'))
        await this.publish({ c: 'clear' })
        break
    }
  }

  deliver (envelope: Envelope) {
    if ('ms' in envelope) {
      for (const conn of this.conns) {
        if (envelope.to && envelope.to !== (conn.host ? 'host' : 'phone')) continue
        for (const m of envelope.ms) conn.peer.send(m)
      }
      return
    }

    switch (envelope.c) {
      case 'leave': {
        if (this.phones.has(envelope.id)) {
          this.online(this.phones.get(envelope.id)!.cursor).catch(err => console.error('[party]', err))
          return
        }
        this.toHosts({ t: 'leave', id: envelope.id })
        return
      }
      case 'reset':
        for (const { cursor } of this.phones.values()) {
          cursor.x = 0.5
          cursor.y = 0.5
          this.pending.add(cursor.id)
        }
        this.schedule()
        this.toPhones({ t: 'reset' })
        return
      case 'clear':
        for (const { conns } of this.phones.values()) {
          for (const conn of conns) {
            conn.id = undefined
            conn.peer.close(4000, 'reset')
          }
        }
        this.phones.clear()
        this.pending.clear()
        this.dirty.clear()
        this.toHosts({ t: 'sync', cursors: [] })
    }
  }

  toHosts (msg: unknown) {
    const payload = JSON.stringify(msg)
    for (const conn of this.conns) {
      if (conn.host) conn.peer.send(payload)
    }
  }

  toPhones (msg: unknown) {
    const payload = JSON.stringify(msg)
    for (const conn of this.conns) {
      if (!conn.host) conn.peer.send(payload)
    }
  }

  schedule () {
    this.flushTimer ||= setTimeout(() => {
      this.flushTimer = undefined
      const ms: string[] = []
      for (const id of this.pending) {
        const cursor = this.phones.get(id)?.cursor
        if (cursor) ms.push(JSON.stringify({ t: 'p', id, x: cursor.x, y: cursor.y }))
      }
      this.pending.clear()
      if (ms.length) this.publish({ to: 'host', ms }).catch(err => console.error('[party]', err))
    }, BROADCAST_INTERVAL)
  }

  persist (id: string) {
    this.dirty.add(id)
    this.persistTimer ||= setTimeout(() => {
      this.flushPersist().catch(err => console.error('[party]', err))
    }, PERSIST_INTERVAL)
  }

  async flushPersist () {
    clearTimeout(this.persistTimer)
    this.persistTimer = undefined
    const entries: Record<string, Cursor> = {}
    for (const id of this.dirty) {
      const cursor = this.phones.get(id)?.cursor
      if (cursor) entries[id] = cursor
    }
    this.dirty.clear()
    await this.store.hset(this.key('cursors'), entries)
  }

  async onlineCursors () {
    const key = this.key('online')
    await this.store.prune(key, Date.now() - STALE_AFTER)
    const ids = await this.store.members(key)
    return (await this.store.hmget<Cursor>(this.key('cursors'), ids)).filter(Boolean) as Cursor[]
  }

  override detach (conn: Conn) {
    const empty = super.detach(conn)
    if (empty) {
      clearTimeout(this.flushTimer)
      this.flushTimer = undefined
    }
    return empty
  }
}

function makeName (n: number) {
  const adj = ADJECTIVES[n % ADJECTIVES.length]
  const noun = NOUNS[(n * 7 + Math.floor(n / ADJECTIVES.length)) % NOUNS.length]
  return `${adj} ${noun}`
}

function sanitiseScene (scene: unknown): Scene | null {
  if (!scene || typeof scene !== 'object') return null
  const s = scene as Record<string, any>
  const zones = Array.isArray(s.zones) ? s.zones : []
  return {
    title: typeof s.title === 'string' ? s.title.slice(0, 200) : undefined,
    zones: zones.slice(0, 16).map((z: Record<string, any>, i: number) => ({
      id: String(z?.id ?? i),
      label: String(z?.label ?? ''),
      color: typeof z?.color === 'string' ? z.color : COLORS[i % COLORS.length]!,
      x: clamp(z?.x),
      y: clamp(z?.y),
      w: clamp(z?.w),
      h: clamp(z?.h),
    })),
  }
}
