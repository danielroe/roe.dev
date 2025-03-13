<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw] flex justify-between max-w-[37.50rem]">
      <h1 class="text-2xl">
        what are you thinking?
      </h1>
      <div
        class="mt-4 text-sm"
        :class="isConnected ? 'text-green-500' : 'text-red-500'"
      >
        {{ isConnected ? 'connected' : 'connecting...' }}
      </div>
    </header>

    <main class="text-muted text-lg max-w-[37.50rem]">
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <transition-group name="fade">
          <div
            v-for="reaction in displayedReactions"
            :key="reaction.id"
            class="emoji-reaction absolute pointer-events-none select-none z-999"
            :style="{
              left: `${reaction.position.x}%`,
              bottom: `${reaction.position.y}%`,
              fontSize: `${reaction.size}px`,
            }"
          >
            {{ reaction.emoji }}
          </div>
        </transition-group>
      </div>

      <div class="grid grid-cols-4 gap-3 mb-4 touch-manipulation">
        <button
          v-for="emoji in predefinedEmojis"
          :key="emoji"
          type="button"
          class="aspect-square text-[1.75rem] rounded-lg flex items-center justify-center bg-muted bg-opacity-10 transition-all duration-200 hover:bg-opacity-20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed select-none"
          :disabled="!isConnected"
          @click="sendEmoji(emoji)"
          @dblclick="sendEmoji(emoji, 3)"
          @touchstart.passive="preventZoom"
        >
          {{ emoji }}
        </button>

        <form
          class="aspect-square rounded-lg bg-muted/15 transition-all duration-200 hover:bg-muted/25"
          :class="{ 'opacity-50 cursor-not-allowed': !isConnected }"
          @submit.prevent="() => sendCustomEmoji(customEmoji)"
        >
          <label class="flex flex-col items-center justify-center h-full touch-manipulation">
            <input
              v-model="customEmoji"
              type="text"
              class="w-14 h-14 text-center text-[1.75rem] bg-transparent border-none outline-none"
              :disabled="!isConnected"
              @touchstart.passive="preventZoom"
            >
            <span class="text-xs text-muted mt-1">custom</span>
          </label>
          <button
            type="submit"
            class="sr-only"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue'
import PartySocket from 'partysocket'

definePageMeta({ title: 'Live Reactions' })

const predefinedEmojis = ['👍', '❤️', '😂', '👏', '🔥', '🎉', '🤯', '👨‍💻', '🙌', '🎯', '✅']
const customEmoji = ref('')
const displayedReactions = ref<Array<{
  id: string
  emoji: string
  position: { x: number, y: number }
  size: number
}>>([])
const isConnected = ref(false)

// Connect to PartyKit
let partySocket: PartySocket
if (import.meta.client) {
  onNuxtReady(() => {
    partySocket = new PartySocket({
      host: import.meta.dev ? 'localhost:1999' : 'v.danielroe.partykit.dev',
      room: 'reactions',
    })

    partySocket.onopen = () => {
      isConnected.value = true
    }

    partySocket.onmessage = event => {
      const data = event.data?.toString()
      if (data?.startsWith('reaction:')) {
        const emoji = data.replace('reaction:', '')
        displayReaction(emoji)
      }
    }
  })

  onBeforeUnmount(() => partySocket?.close())
  onDeactivated(() => partySocket?.close())
  onActivated(() => partySocket?.reconnect())
}

async function sendEmoji (emoji: string, count = 1) {
  if (!isConnected.value) return
  for (let i = 0; i < count; i++) {
    partySocket.send(`reaction:${emoji}`)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

watch(customEmoji, sendCustomEmoji)

function sendCustomEmoji (emoji: string) {
  if (!emoji?.trim() || !isConnected.value) return

  // Basic client-side emoji validation
  if (!isValidEmoji(emoji)) {
    customEmoji.value = ''
    return
  }

  sendEmoji(emoji)
  customEmoji.value = ''
}

function displayReaction (emoji: string) {
  const id = Date.now().toString() + Math.random().toString()
  const size = Math.random() * 20 + 30 // 30-50px size

  // Create the reaction with position information only
  const newReaction = {
    id,
    emoji,
    position: {
      x: Math.random() * 80 + 10, // 10-90% horizontal
      y: 5, // Start near bottom (5% from bottom)
    },
    size,
  }

  displayedReactions.value.push(newReaction)

  // Remove the reaction after animation completes (matches the CSS animation duration)
  setTimeout(() => {
    displayedReactions.value = displayedReactions.value.filter(r => r.id !== id)
  }, 2500) // 2.5s = animation duration
}

function preventZoom () {
  // This helps prevent double-tap zoom on iOS/mobile
}
</script>

<style scoped>
@keyframes float-up {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.9);
  }

  8% {
    opacity: 1;
    transform: translateY(-30px) scale(1);
  }

  85% {
    opacity: 0.9;
    transform: translateY(-70vh) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateY(-90vh) scale(0.9);
  }
}

.emoji-reaction {
  animation: float-up 2.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  line-height: 1;
  text-shadow: 0 0 5px rgb(0 0 0 / 20%);
  will-change: transform, opacity;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Focus styles for the custom emoji input */
input:focus {
  outline: none;
}

/* Remove spinner buttons from number inputs */
input::-webkit-inner-spin-button,
input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
</style>
