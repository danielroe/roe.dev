<script setup lang="ts">
import type { DevRoeAma } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'AMA - admin - Daniel Roe' })

interface AmaEntry {
  rkey: string
  uri: string
  cid: string
  status: 'unanswered' | 'answered'
  question: string
  posts: DevRoeAma.Post[]
  platforms?: DevRoeAma.Platforms
  publishedLinks?: DevRoeAma.PublishedLinks
  createdAt: string
  answeredAt?: string
}

const { data, refresh } = await useFetch<AmaEntry[]>('/api/admin/ama', { default: () => [] })

const filter = ref<'unanswered' | 'all'>('unanswered')
const visible = computed(() => (data.value ?? []).filter(a => filter.value === 'all' || a.status === 'unanswered'))

const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })

async function remove (rkey: string) {
  if (!confirm('Delete this question?')) return
  await $fetch(`/api/admin/ama/${rkey}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <AdminShell title="AMA">
    <div class="flex items-center gap-3 mb-4">
      <div class="flex gap-1 text-sm">
        <button
          v-for="f in ['unanswered', 'all'] as const"
          :key="f"
          type="button"
          :class="filter === f ? 'bg-primary text-background' : 'bg-accent text-muted'"
          class="px-3 py-1 capitalize hover:opacity-80 transition-opacity"
          @click="filter = f"
        >
          {{ f }}
        </button>
      </div>
    </div>

    <ul class="divide-y divide-accent">
      <li
        v-for="ama in visible"
        :key="ama.rkey"
        class="py-3 flex items-start gap-4"
      >
        <div class="flex-grow min-w-0">
          <NuxtLink
            :to="`/admin/ama/${ama.rkey}`"
            class="block underline-offset-4 hover:underline"
          >
            {{ ama.question }}
          </NuxtLink>
          <div class="text-xs text-muted mt-1 flex flex-wrap gap-x-3">
            <span>{{ ama.status === 'answered' ? '✅' : '✨' }} {{ ama.status }}</span>
            <span>{{ formatter.format(new Date(ama.createdAt)) }}</span>
            <a
              v-if="ama.publishedLinks?.bluesky"
              :href="ama.publishedLinks.bluesky"
              target="_blank"
              rel="noopener"
              class="text-muted hover:text-primary"
            >bluesky ↗</a>
            <a
              v-if="ama.publishedLinks?.mastodon"
              :href="ama.publishedLinks.mastodon"
              target="_blank"
              rel="noopener"
              class="text-muted hover:text-primary"
            >mastodon ↗</a>
            <a
              v-if="ama.publishedLinks?.linkedin"
              :href="ama.publishedLinks.linkedin"
              target="_blank"
              rel="noopener"
              class="text-muted hover:text-primary"
            >linkedin ↗</a>
          </div>
        </div>
        <button
          type="button"
          class="text-sm text-muted hover:text-red-500 transition-colors"
          @click="remove(ama.rkey)"
        >
          Delete
        </button>
      </li>
    </ul>

    <p
      v-if="!visible.length"
      class="text-muted text-sm"
    >
      {{ filter === 'unanswered' ? 'No unanswered questions.' : 'No questions yet.' }}
    </p>
  </AdminShell>
</template>
