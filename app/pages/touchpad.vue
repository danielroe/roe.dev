<template>
  <div
    class="touchpad fixed inset-0 grid gap-4 bg-background text-primary font-sans select-none touch-none"
    :class="`is-${mode}`"
    :style="{ '--me': me?.color || 'rgb(var(--muted))' }"
  >
    <header class="touchpad-header flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span
          class="block w-8 h-8 rounded-full bg-[var(--me)] transition-colors duration-300"
          aria-hidden="true"
        />
        <div class="leading-none">
          <p class="text-xs uppercase tracking-widest text-muted">
            {{ me ? 'you are' : status === 'open' ? 'joining…' : 'connecting…' }}
          </p>
          <p class="text-2xl font-semibold mt-1 lowercase">
            {{ me?.name || '\u00A0' }}
          </p>
        </div>
      </div>
      <span
        class="block w-2 h-2 rounded-full"
        :class="status === 'open' ? 'bg-green-500' : 'bg-red-500 animate-pulse'"
        :aria-label="status === 'open' ? 'connected' : 'reconnecting'"
      />
    </header>

    <section
      v-show="mode !== 'react'"
      class="touchpad-map-wrap flex flex-col gap-2"
      aria-hidden="true"
    >
      <p
        v-if="scene?.title"
        class="text-lg text-center"
      >
        {{ scene.title }}
      </p>
      <div
        ref="map"
        class="relative w-full aspect-video bg-accent"
      >
        <div
          v-for="zone in scene?.zones || []"
          :key="zone.id"
          class="touchpad-zone absolute flex items-center justify-center p-1 text-sm text-center leading-tight transition duration-200"
          :class="{
            'is-active': zone.id === currentZone,
            'is-winner': zone.id === winner,
            'opacity-30': winner && zone.id !== winner,
          }"
          :style="{
            'left': `${zone.x * 100}%`,
            'top': `${zone.y * 100}%`,
            'width': `${zone.w * 100}%`,
            'height': `${zone.h * 100}%`,
            '--zone': zone.color,
          }"
        >
          <span>{{ zone.label }}</span>
        </div>
        <span
          class="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-[var(--me)] ring-2 ring-primary will-change-transform"
          :style="{ transform: `translate(${pos.x * mapSize.w}px, ${pos.y * mapSize.h}px)` }"
        />
      </div>
      <p class="min-h-[1.25em] text-sm text-center text-muted">
        <template v-if="customOpen">
          pick any emoji on your keyboard
        </template>
        <template v-else-if="winner && winnerLabel">
          🎉 {{ winnerLabel }}
        </template>
        <template v-else-if="scene?.zones?.length">
          {{ currentZoneLabel ? `voting for ${currentZoneLabel}` : 'move into a zone to vote' }}
        </template>
        <template v-else>
          drag to move · tap to click
        </template>
      </p>
    </section>

    <div
      v-if="mode === 'react'"
      class="touchpad-map-wrap flex flex-col justify-center gap-1 text-center"
    >
      <p
        v-if="scene?.title"
        class="text-lg"
      >
        {{ scene.title }}
      </p>
      <p class="text-sm text-muted">
        {{ customOpen ? 'pick any emoji on your keyboard' : 'tap to react' }}
      </p>
    </div>

    <div
      v-if="mode !== 'cursor'"
      class="touchpad-emojis grid gap-2"
      :style="mode === 'react'
        ? { gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.ceil(tiles / gridColumns)}, minmax(0, 1fr))` }
        : { gridTemplateColumns: `repeat(${tiles}, minmax(0, 1fr))` }"
    >
      <button
        v-for="emoji in emojis"
        :key="emoji"
        type="button"
        class="touchpad-emoji f-ring-inset flex items-center justify-center bg-accent"
        :aria-label="`react with ${emoji}`"
        @pointerdown="onReact(emoji, $event.currentTarget)"
        @click="$event.detail === 0 && onReact(emoji, $event.currentTarget)"
        @contextmenu.prevent
      >
        <span aria-hidden="true">{{ emoji }}</span>
      </button>
      <label
        class="touchpad-emoji touchpad-custom relative flex items-center justify-center bg-accent"
        :class="{ 'is-open': customOpen }"
        :style="mode === 'react' ? { gridColumn: `span ${gridColumns - emojis.length % gridColumns}` } : undefined"
      >
        <span
          v-show="!customOpen"
          class="text-muted"
          aria-hidden="true"
        >+</span>
        <input
          type="text"
          class="absolute inset-0 w-full h-full p-0 text-center bg-transparent border-none outline-none"
          aria-label="react with any emoji"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="done"
          @focus="customOpen = true"
          @blur="onCustomBlur"
          @input="onCustomInput"
          @compositionend="onCustomInput"
          @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
        >
      </label>
    </div>

    <div
      v-if="mode !== 'react'"
      ref="surface"
      class="touchpad-surface relative min-h-32 overflow-hidden touch-none cursor-crosshair bg-accent"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
      @contextmenu.prevent
    >
      <span
        v-for="ripple in ripples"
        :key="ripple.id"
        class="touchpad-ripple absolute w-12 h-12 -ml-6 -mt-6 border-2 border-[var(--me)] rounded-full pointer-events-none"
        :style="{ left: `${ripple.x}px`, top: `${ripple.y}px` }"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import PartySocket from 'partysocket'

interface Zone { id: string, label: string, color: string, x: number, y: number, w: number, h: number }
interface Scene { title?: string, zones: Zone[] }
interface Me { id: string, name: string, color: string }
type Mode = 'cursor' | 'react' | 'both'

useHead({
  title: 'touchpad',
  htmlAttrs: { class: 'touchpad-root' },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
  ],
})

const status = ref<'connecting' | 'open' | 'closed'>('connecting')
const me = ref<Me>()
const scene = ref<Scene | null>(null)
const winner = ref<string | null>(null)
const pos = reactive({ x: 0.5, y: 0.5 })
const surface = useTemplateRef<HTMLElement>('surface')
const mapEl = useTemplateRef<HTMLElement>('map')
const ripples = ref<Array<{ id: number, x: number, y: number }>>([])
const mapSize = reactive({ w: 0, h: 0 })
const mode = ref<Mode>('cursor')
const emojis = ref<string[]>([])
const customOpen = ref(false)
const tiles = computed(() => emojis.value.length + 1)
const gridColumns = computed(() => tiles.value <= 4 ? 2 : 3)

const currentZone = computed(() => scene.value?.zones.find(z => pos.x >= z.x && pos.x <= z.x + z.w && pos.y >= z.y && pos.y <= z.y + z.h)?.id ?? null)
const currentZoneLabel = computed(() => scene.value?.zones.find(z => z.id === currentZone.value)?.label)
const winnerLabel = computed(() => scene.value?.zones.find(z => z.id === winner.value)?.label)

const vibrate = (pattern: number | number[]) => navigator.vibrate?.(pattern)

watch(currentZone, zone => {
  if (zone) vibrate(10)
})

let socket: PartySocket | undefined
let dirty = false
let sendTimer: ReturnType<typeof setInterval> | undefined

function send (msg: Record<string, unknown>) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg))
}

function getId () {
  let id = localStorage.getItem('touchpad-id')
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    localStorage.setItem('touchpad-id', id)
  }
  return id
}

function setPos (x: number, y: number) {
  x = Math.min(1, Math.max(0, x))
  y = Math.min(1, Math.max(0, y))
  if (x === pos.x && y === pos.y) return
  pos.x = x
  pos.y = y
  dirty = true
}

/* gesture handling */
const SENSITIVITY = 1 / 380
const ACCELERATION = 0.6
const FRICTION = 0.004
const MAX_SPEED = 0.003
const TAP_MAX_MS = 250
const TAP_MAX_PX = 10

let activePointer: number | null = null
let last = { x: 0, y: 0, t: 0 }
let start = { x: 0, y: 0, t: 0 }
let travelled = 0
let velocity = { x: 0, y: 0 }
let inertiaFrame: number | undefined

function stopInertia () {
  if (inertiaFrame) cancelAnimationFrame(inertiaFrame)
  inertiaFrame = undefined
}

function onDown (e: PointerEvent) {
  if (activePointer !== null) return
  e.preventDefault()
  stopInertia()
  activePointer = e.pointerId
  surface.value?.setPointerCapture(e.pointerId)
  start = last = { x: e.clientX, y: e.clientY, t: e.timeStamp }
  travelled = 0
  velocity = { x: 0, y: 0 }
}

function onMove (e: PointerEvent) {
  if (e.pointerId !== activePointer) return
  e.preventDefault()
  const events = e.getCoalescedEvents?.() || [e]
  for (const ev of events) {
    const dx = ev.clientX - last.x
    const dy = ev.clientY - last.y
    const dt = Math.max(8, ev.timeStamp - last.t)
    const dist = Math.hypot(dx, dy)
    travelled += dist
    const gain = SENSITIVITY * (1 + ACCELERATION * Math.min(3, dist / dt))
    const mx = dx * gain
    // y is scaled by the slide aspect ratio so equal finger movement is equal on-screen movement
    const my = dy * gain * (16 / 9)
    setPos(pos.x + mx, pos.y + my)
    const k = 0.35
    velocity = { x: velocity.x * (1 - k) + (mx / dt) * k, y: velocity.y * (1 - k) + (my / dt) * k }
    const speed = Math.hypot(velocity.x, velocity.y)
    if (speed > MAX_SPEED) velocity = { x: velocity.x / speed * MAX_SPEED, y: velocity.y / speed * MAX_SPEED }
    last = { x: ev.clientX, y: ev.clientY, t: ev.timeStamp }
  }
}

function onUp (e: PointerEvent) {
  if (e.pointerId !== activePointer) return
  activePointer = null
  const isTap = e.timeStamp - start.t < TAP_MAX_MS && travelled < TAP_MAX_PX
  if (isTap) {
    tap(e)
    return
  }
  if (e.timeStamp - last.t > 60) return
  let prev = performance.now()
  const step = (now: number) => {
    const dt = Math.min(50, now - prev)
    prev = now
    const decay = Math.exp(-FRICTION * dt)
    velocity.x *= decay
    velocity.y *= decay
    setPos(pos.x + velocity.x * dt, pos.y + velocity.y * dt)
    if (Math.hypot(velocity.x, velocity.y) > 0.00002) inertiaFrame = requestAnimationFrame(step)
    else inertiaFrame = undefined
  }
  inertiaFrame = requestAnimationFrame(step)
}

function onCancel (e: PointerEvent) {
  if (e.pointerId === activePointer) activePointer = null
}

let rippleId = 0
function tap (e: PointerEvent) {
  dirty = false
  send({ t: 'tap', x: pos.x, y: pos.y })
  vibrate(5)
  const rect = surface.value!.getBoundingClientRect()
  const id = rippleId++
  ripples.value.push({ id, x: e.clientX - rect.left, y: e.clientY - rect.top })
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
}

function onReact (emoji: string, el?: EventTarget | null) {
  send({ t: 'react', emoji })
  vibrate(10)
  ;(el as HTMLElement | null)?.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(0.85)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' })
}

function onCustomInput (e: Event) {
  if ((e as InputEvent).isComposing) return
  const input = e.target as HTMLInputElement
  const last = splitGraphemes(input.value.trim()).at(-1)
  if (last && isSingleEmoji(last)) {
    input.value = ''
    onReact(last, input.parentElement)
  }
  else if (input.value.length > 32) {
    input.value = ''
  }
}

function onCustomBlur (e: FocusEvent) {
  (e.target as HTMLInputElement).value = ''
  customOpen.value = false
}

watch(mode, value => {
  if (value === 'cursor') customOpen.value = false
  if (value !== 'react') return
  stopInertia()
  activePointer = null
})

/* wake lock keeps the phone from sleeping mid-talk */
let wakeLock: { release: () => Promise<void> } | undefined
async function requestWakeLock () {
  try {
    wakeLock = await (navigator as any).wakeLock?.request('screen')
  }
  catch {
    // unsupported or denied
  }
}
function onVisibility () {
  if (document.visibilityState === 'visible') {
    requestWakeLock()
    if (socket && socket.readyState !== WebSocket.OPEN) socket.reconnect()
  }
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  const params = new URLSearchParams(location.search)
  const host = params.get('host') || location.host
  socket = new PartySocket({ host, room: 'cursors', query: { role: 'phone' } })

  socket.addEventListener('open', () => {
    status.value = 'open'
    send({ t: 'hello', id: getId() })
  })
  socket.addEventListener('close', () => {
    status.value = 'closed'
  })
  socket.addEventListener('message', event => {
    let msg: any
    try {
      msg = JSON.parse(event.data)
    }
    catch {
      return
    }
    switch (msg.t) {
      case 'you':
        me.value = { id: msg.id, name: msg.name, color: msg.color }
        if (typeof msg.x === 'number' && typeof msg.y === 'number') {
          pos.x = msg.x
          pos.y = msg.y
        }
        break
      case 'mode':
        mode.value = ['cursor', 'react', 'both'].includes(msg.mode) ? msg.mode : 'cursor'
        emojis.value = Array.isArray(msg.emojis) ? msg.emojis.filter((e: unknown) => typeof e === 'string') : []
        if (!emojis.value.length && mode.value !== 'cursor') mode.value = 'cursor'
        break
      case 'scene':
        scene.value = msg.scene
        winner.value = null
        break
      case 'result':
        winner.value = msg.zoneId
        vibrate(msg.zoneId === currentZone.value ? [30, 60, 30, 60, 80] : 20)
        break
      case 'reset':
        stopInertia()
        setPos(0.5, 0.5)
        break
    }
  })

  sendTimer = setInterval(() => {
    if (!dirty) return
    dirty = false
    send({ t: 'p', x: pos.x, y: pos.y })
  }, 33)

  const map = mapEl.value
  if (map) {
    resizeObserver = new ResizeObserver(() => {
      mapSize.w = map.clientWidth
      mapSize.h = map.clientHeight
    })
    resizeObserver.observe(map)
  }

  requestWakeLock()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  stopInertia()
  clearInterval(sendTimer)
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
  wakeLock?.release().catch(() => {})
  socket?.close()
})
</script>

<style>
html.touchpad-root,
html.touchpad-root body {
  overscroll-behavior: none;
  overflow: hidden;
  height: 100%;
}
</style>

<style scoped>
.touchpad {
  grid-template:
    "header" auto
    "map" auto
    "surface" 1fr
    / minmax(0, 1fr);
  padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.touchpad.is-both {
  grid-template-areas: "header" "map" "emojis" "surface";
  grid-template-rows: auto auto auto 1fr;
}

.touchpad.is-react {
  grid-template-areas: "header" "map" "emojis";
  grid-template-rows: auto auto 1fr;
}

.touchpad-header {
  grid-area: header;
}

.touchpad-map-wrap {
  grid-area: map;
}

.touchpad-emojis {
  grid-area: emojis;
}

.touchpad-emoji {
  container-type: size;
  min-height: 3.5rem;
  font-size: 2rem;
  line-height: 1;
  touch-action: manipulation;
  user-select: none;
  -webkit-touch-callout: none;
}

.touchpad-emoji > span {
  font-size: clamp(1.75rem, 60cqmin, 6rem);
  pointer-events: none;
}

.touchpad-emoji:active {
  background: color-mix(in srgb, var(--me) 25%, var(--accent));
}

.touchpad-custom input {
  font-size: 2rem;
  opacity: 0;
  user-select: text;
  caret-color: var(--me);
}

.touchpad-custom.is-open input {
  opacity: 1;
}

.touchpad-custom.is-open {
  box-shadow: inset 0 0 0 2px var(--me);
}

.is-both .touchpad-emoji {
  height: 4rem;
}

.touchpad-zone {
  border: 2px solid var(--zone);
  background: color-mix(in srgb, var(--zone) 12%, transparent);
}

.touchpad-zone.is-active {
  background: color-mix(in srgb, var(--zone) 40%, transparent);
}

.touchpad-zone.is-winner {
  background: var(--zone);
  color: #111827;
}

.touchpad-surface {
  grid-area: surface;
  background-image: radial-gradient(circle at center, rgb(var(--muted) / 25%) 1px, transparent 1.5px);
  background-size: 22px 22px;
}

.touchpad-ripple {
  animation: ripple 0.6s ease-out forwards;
}

@media (orientation: landscape) and (height <= 600px) {
  .touchpad {
    grid-template:
      "header surface" auto
      "map surface" 1fr
      / minmax(0, 2fr) minmax(0, 3fr);
  }

  .touchpad.is-both {
    grid-template-areas: "header surface" "map surface" "map emojis";
    grid-template-rows: auto 1fr auto;
  }

  .touchpad.is-react {
    grid-template-areas: "header emojis" "map emojis";
    grid-template-rows: auto 1fr;
  }
}

@keyframes ripple {
  from {
    opacity: 1;
    transform: scale(0.4);
  }

  to {
    opacity: 0;
    transform: scale(2);
  }
}
</style>
