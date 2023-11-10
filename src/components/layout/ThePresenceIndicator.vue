<template>
  <div
    class="fixed bottom-[1rem] right-[1rem] p-1 bg-background rounded-full overflow-hidden z-10"
  >
    <component
      :is="status === 'live' ? 'a' : 'span'"
      :href="status === 'live' ? 'https://twitch.tv/danielroe' : null"
      :target="status === 'live' ? '_blank' : null"
      class="pl-2 pr-2 py-1 rounded-full flex flex-row items-center shadow tracking-none border-1 text-xs transition-opacity"
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
  </div>
</template>

<script setup lang="ts">
import PartySocket from 'partysocket'

const colorSet = {
  live: {
    badge:
      'light:border-red-800 dark:border-red-400 light:shadow-red-400 dark:shadow-red-800 text-red-400 light:text-red-800',
    block: 'light:bg-red-800 dark:bg-red dark:shadow-red-800',
  },
  default: {
    badge:
      'light:border-green-800 dark:border-green-400 light:shadow-green-400 dark:shadow-green-800 opacity-50 hover:opacity-100 focus:opacity-100',
    block: 'light:bg-green-800 dark:bg-green dark:shadow-green-800',
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
