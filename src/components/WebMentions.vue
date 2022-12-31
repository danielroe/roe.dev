<script setup lang="ts">
interface WebMention {
  type: 'entry'
  author: {
    type: 'card'
    name: string
    photo: string
    url: string
  }
  content?: {
    html: string
    text: string
  }
  url: string
  published: null
  'wm-id': number
  'wm-received': string
  'wm-source': string
  'wm-target': string
  'like-of': string
  'wm-property': 'like-of' | 'mention-of'
  'wm-private': boolean
}

const path = `https://roe.dev${useRoute().path}`
const { data: mentions, pending } = await useFetch(
  `https://webmention.io/api/mentions.jf2?target=${path}`,
  {
    key: path,
    default: () => [],
    server: false,
    transform: (r: any) => r.children as WebMention[],
  }
)
</script>

<template>
  <hr
    class="block mx-auto my-8 content w-4 border-t-2 border-solid border-gray-700"
  />
  <h2 class="text-xl mb-4">Mentions</h2>
  <div v-if="pending" class="flex items-center justify-center w-[2rem]">
    <svg class="h-6 w-6" alt="">
      <use xlink:href="#loading" />
    </svg>
    <span class="sr-only"> Loading </span>
  </div>
  <div v-else-if="!mentions || !mentions.length">No mentions yet</div>
  <div v-else class="flex flex-col gap-8">
    <div v-for="mention in mentions" :key="mention['wm-id']" class="flex gap-4">
      <a :href="mention.author.url" class="flex-shrink-0">
        <img
          :src="mention.author.photo"
          :alt="mention.author.name"
          class="rounded-full h-12 w-12"
        />
      </a>
      <div class="flex flex-col gap-2 items-start">
        <div v-if="mention.content?.html" v-html="mention.content.html" />
        <div v-else-if="mention['wm-property'] === 'like-of'">❤️</div>
        <a :href="mention.url">&raquo; Link</a>
      </div>
    </div>
  </div>
</template>
