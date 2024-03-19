<template>
  <div
    class="fixed bottom-[1rem] right-[1rem] p-1 bg-background rounded-full overflow-hidden z-10"
  >
    <component
      :is="status === 'live' ? LiveWrapper : PresenceWrapper"
      class="pl-2 pr-2 py-1 rounded-full flex flex-row items-center shadow tracking-none border-1 text-xs transition-opacity"
      :class="colorSet[status].badge"
    >
      <span
        class="rounded-full inline-block h-2 w-2 animate-pulse shadow"
        :class="colorSet[status].block"
      />
      <span
        class="ml-2 tabular-nums flex flex-row items-center gap-1 uppercase tracking-wider"
      >
        <template v-if="status === 'live'"> live now </template>
        <template v-else>
          {{ count || '&nbsp;' }}
          <span
            v-if="count"
            class="sr-only"
          >viewers on website</span>
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
      'light:border-green-800 dark:border-green-400 light:shadow-green-400 dark:shadow-green-800 opacity-60 hover:opacity-100 focus:opacity-100',
    block: 'light:bg-green-800 dark:bg-green dark:shadow-green-800',
  },
}

const status = ref<keyof typeof colorSet>('default')
const count = ref<null | number>(null)

// eslint-disable-next-line vue/one-component-per-file
const LiveWrapper = defineComponent({
  setup (_props, { slots }) {
    return () =>
      h(
        'a',
        {
          href: 'https://twitch.tv/danielroe',
          target: '_blank',
          title: 'Live now on Twitch',
        },
        slots,
      )
  },
})

// eslint-disable-next-line vue/one-component-per-file
const PresenceWrapper = defineComponent({
  setup (_props, { slots }) {
    return () =>
      h(
        'span',
        {
          title: count.value ? `${count.value} viewers on website` : undefined,
        },
        slots,
      )
  },
})

if (import.meta.client) {
  let partySocket: PartySocket
  onNuxtReady(() => {
    partySocket = new PartySocket({
      host: import.meta.dev ? 'localhost:1999' : 'v.danielroe.partykit.dev',
      room: 'site',
    })

    partySocket.onmessage = evt => {
      const data = evt.data as string
      const [type, value] = data.split(':')
      switch (type) {
        case 'connections':
          count.value = parseInt(value)
          break

        case 'status':
          if (value in colorSet) status.value = value as keyof typeof colorSet
          break
      }
    }
  })

  onBeforeUnmount(() => partySocket?.close())
  onDeactivated(() => partySocket?.close())
  onActivated(() => partySocket?.reconnect())
}
</script>
