import type * as Party from 'partykit/server'

export interface Cursor {
  id: string
  name: string
  color: string
  x: number
  y: number
}

export interface Zone {
  id: string
  label: string
  color: string
  x: number
  y: number
  w: number
  h: number
}

export interface Scene {
  title?: string
  zones: Zone[]
}

interface ConnState {
  role: 'host' | 'phone'
  id?: string
}

const ADJECTIVES = ['Brave', 'Sleepy', 'Jolly', 'Sneaky', 'Fuzzy', 'Clever', 'Bouncy', 'Cosy', 'Zippy', 'Plucky', 'Witty', 'Sunny', 'Mighty', 'Curious', 'Dapper', 'Nimble', 'Gentle', 'Merry', 'Bold', 'Quirky']
const NOUNS = ['Knedlík', 'Trdelník', 'Golem', 'Krtek', 'Pivo', 'Koláček', 'Rohlík', 'Vltava', 'Klobása', 'Švejk', 'Beaver', 'Otter', 'Lynx', 'Heron', 'Badger', 'Hedgehog', 'Stork', 'Marten', 'Owl', 'Carp']
const COLORS = ['#ff5d8f', '#ffb347', '#ffe156', '#8ce99a', '#38d9a9', '#4dabf7', '#748ffc', '#b197fc', '#f783ac', '#ff8787', '#63e6be', '#74c0fc', '#ffa94d', '#d0bfff', '#a9e34b', '#66d9e8']

const BROADCAST_INTERVAL = 33

const clamp = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5

export default class CursorsParty implements Party.Server {
  cursors = new Map<string, Cursor>()
  online = new Map<string, Set<string>>()
  scene: Scene | null = null
  pending = new Map<string, { x: number, y: number }>()
  timer: ReturnType<typeof setTimeout> | undefined
  assigned = 0

  constructor (readonly room: Party.Room) {}

  async onStart () {
    this.scene = await this.room.storage.get<Scene | null>('scene') ?? null
    const stored = await this.room.storage.get<Cursor[]>('cursors')
    for (const c of stored || []) this.cursors.set(c.id, c)
    this.assigned = this.cursors.size
  }

  onConnect (conn: Party.Connection<ConnState>, ctx: Party.ConnectionContext) {
    const role = new URL(ctx.request.url).searchParams.get('role') === 'host' ? 'host' : 'phone'
    conn.setState({ role })
    if (role === 'host') {
      conn.send(JSON.stringify({ t: 'sync', cursors: this.onlineCursors() }))
      conn.send(JSON.stringify({ t: 'scene', scene: this.scene }))
    }
    else {
      conn.send(JSON.stringify({ t: 'scene', scene: this.scene }))
    }
  }

  onMessage (raw: string | ArrayBuffer | ArrayBufferView, conn: Party.Connection<ConnState>) {
    if (typeof raw !== 'string' || raw.length > 20_000) return
    let msg: Record<string, any>
    try {
      msg = JSON.parse(raw)
    }
    catch {
      return
    }
    if (!msg || typeof msg !== 'object') return
    const state = conn.state
    if (!state) return

    if (state.role === 'host') {
      this.onHostMessage(msg)
      return
    }

    switch (msg.t) {
      case 'hello': {
        const id = typeof msg.id === 'string' && msg.id.length <= 64 ? msg.id : conn.id
        if (state.id && state.id !== id) this.detach(state.id, conn.id)
        conn.setState({ role: 'phone', id })
        let cursor = this.cursors.get(id)
        if (!cursor) {
          const n = this.assigned++
          cursor = {
            id,
            name: this.makeName(n),
            color: COLORS[n % COLORS.length]!,
            x: 0.5,
            y: 0.5,
          }
          this.cursors.set(id, cursor)
          this.persist()
        }
        if (typeof msg.name === 'string' && msg.name.trim()) {
          cursor.name = msg.name.trim().slice(0, 32)
          this.persist()
        }
        const conns = this.online.get(id) ?? new Set()
        const wasOnline = conns.size > 0
        conns.add(conn.id)
        this.online.set(id, conns)
        conn.send(JSON.stringify({ t: 'you', ...cursor }))
        if (!wasOnline) this.toHosts({ t: 'join', ...cursor })
        break
      }
      case 'p': {
        const cursor = state.id && this.cursors.get(state.id)
        if (!cursor) return
        cursor.x = clamp(msg.x)
        cursor.y = clamp(msg.y)
        this.pending.set(cursor.id, { x: cursor.x, y: cursor.y })
        this.schedule()
        break
      }
      case 'tap': {
        const cursor = state.id && this.cursors.get(state.id)
        if (!cursor) return
        cursor.x = clamp(msg.x)
        cursor.y = clamp(msg.y)
        this.pending.delete(cursor.id)
        this.toHosts({ t: 'tap', id: cursor.id, x: cursor.x, y: cursor.y })
        break
      }
    }
  }

  onClose (conn: Party.Connection<ConnState>) {
    const id = conn.state?.role === 'phone' ? conn.state.id : undefined
    if (id) this.detach(id, conn.id)
  }

  onError (conn: Party.Connection<ConnState>) {
    this.onClose(conn)
  }

  onHostMessage (msg: Record<string, any>) {
    switch (msg.t) {
      case 'scene': {
        this.scene = sanitiseScene(msg.scene)
        this.room.storage.put('scene', this.scene)
        const payload = JSON.stringify({ t: 'scene', scene: this.scene })
        this.room.broadcast(payload)
        break
      }
      case 'result':
        this.toPhones({ t: 'result', zoneId: typeof msg.zoneId === 'string' ? msg.zoneId : null })
        break
      case 'reset':
        for (const [id, cursor] of this.cursors) {
          cursor.x = 0.5
          cursor.y = 0.5
          if (this.online.get(id)?.size) this.pending.set(id, { x: 0.5, y: 0.5 })
        }
        this.schedule()
        this.toPhones({ t: 'reset' })
        break
      case 'clear':
        // forget all names/colours, e.g. between rehearsal and the real talk
        this.cursors.clear()
        this.assigned = 0
        this.room.storage.delete('cursors')
        for (const conn of this.room.getConnections<ConnState>()) {
          if (conn.state?.role === 'phone') conn.close(4000, 'reset')
        }
        this.online.clear()
        this.toHosts({ t: 'sync', cursors: [] })
        break
    }
  }

  detach (id: string, connId: string) {
    const conns = this.online.get(id)
    if (!conns) return
    conns.delete(connId)
    if (conns.size) return
    this.online.delete(id)
    this.pending.delete(id)
    this.toHosts({ t: 'leave', id })
    this.persist()
  }

  schedule () {
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = undefined
      for (const [id, { x, y }] of this.pending) this.toHosts({ t: 'p', id, x, y })
      this.pending.clear()
    }, BROADCAST_INTERVAL)
  }

  onlineCursors () {
    return [...this.online.keys()].map(id => this.cursors.get(id)).filter(Boolean) as Cursor[]
  }

  makeName (n: number) {
    const adj = ADJECTIVES[n % ADJECTIVES.length]
    const noun = NOUNS[(n * 7 + Math.floor(n / ADJECTIVES.length)) % NOUNS.length]
    return `${adj} ${noun}`
  }

  persistTimer: ReturnType<typeof setTimeout> | undefined
  persist () {
    if (this.persistTimer) return
    this.persistTimer = setTimeout(() => {
      this.persistTimer = undefined
      this.room.storage.put('cursors', [...this.cursors.values()])
    }, 1000)
  }

  toHosts (msg: unknown) {
    const payload = JSON.stringify(msg)
    for (const conn of this.room.getConnections<ConnState>()) {
      if (conn.state?.role === 'host') conn.send(payload)
    }
  }

  toPhones (msg: unknown) {
    const payload = JSON.stringify(msg)
    for (const conn of this.room.getConnections<ConnState>()) {
      if (conn.state?.role === 'phone') conn.send(payload)
    }
  }
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
