<template>
  <component
    :is="status === 'live' ? 'a' : 'span'"
    :href="status === 'live' ? 'https://twitch.tv/danielroe' : null"
    :target="status === 'live' ? '_blank' : null"
    class="fixed bottom-[1rem] right-[1rem] rounded-full pl-2 pr-2 py-1 flex flex-row items-center tracking-none border-1 shadow text-xs transition-opacity z-10 bg-background"
    :class="colorSet[status].badge"
    :title="
      status === 'live' ? 'Live now on Twitch' : `${count} viewers on website`
    "
  >
    <span
      class="rounded-full inline-block h-2 w-2 animate-pulse shadow"
      :class="colorSet[status].block"
    />
    <span
      class="ml-2 tabular-nums flex flex-row items-center gap-1 font-bold uppercase tracking-wider"
    >
      <template v-if="status === 'live'"> live now </template>
      <template v-else>
        {{ count || '&nbsp;' }}
        <span v-if="count" class="sr-only">viewers on website</span>
      </template>
    </span>
    &ZeroWidthSpace;
  </component>
</template>

<script setup lang="ts">
import PartySocket from 'partysocket'

const colorSet = {
  live: {
    badge:
      'light:border-red-800 border-red-400 light:shadow-red-400 shadow-red-800 text-red-400 light:text-red-800',
    block: 'light:bg-red-800 bg-red shadow-red-800',
  },
  default: {
    badge:
      'light:border-green-800 border-green-400 light:shadow-green-400 shadow-green-800 opacity-50 hover:opacity-100 focus:opacity-100',
    block: 'light:bg-green-800 bg-green shadow-green-800',
  },
}

const status = ref<keyof typeof colorSet>('default')
const count = ref<null | number>(null)

if (import.meta.client) {
  const partySocket = new PartySocket({
    host: import.meta.dev ? 'localhost:1999' : 'v.danielroe.partykit.dev',
    room: 'site',
  })

  partySocket.onmessage = evt => {
    const data = evt.data as string
    const [type, value] = data.split(':')
    if (type === 'connections') {
      count.value = parseInt(value)
    }
  }

  onBeforeUnmount(() => partySocket.close())
  onDeactivated(() => partySocket.close())
  onActivated(() => partySocket.reconnect())
}
</script>
