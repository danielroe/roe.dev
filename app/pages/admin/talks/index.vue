<script setup lang="ts">
import type { DevRoeTalkGroup } from '#shared/lex'
import type { TalkEntry } from '~~/app/components/admin/TalkDraggable.vue'

definePageMeta({ layout: false })
useHead({ title: 'Talks - admin - Daniel Roe' })

interface TalkGroupEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeTalkGroup.Record
}

const [{ data: talksData, refresh: refreshTalks }, { data: groupsData, refresh: refreshGroups }] = await Promise.all([
  useFetch<TalkEntry[]>('/api/admin/talks', { default: () => [] }),
  useFetch<TalkGroupEntry[]>('/api/admin/talk-groups', { default: () => [] }),
])

const filter = ref<'all' | 'past' | 'upcoming'>('all')
const now = new Date().toISOString()

const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

function inFilter (talk: TalkEntry): boolean {
  if (filter.value === 'past') return talk.value.date < now
  if (filter.value === 'upcoming') return talk.value.date >= now
  return true
}

/** Filter-aware bucket of talks by group URI; `''` collects top-level. */
const bucketed = computed(() => {
  const byGroup = new Map<string, TalkEntry[]>()
  byGroup.set('', [])
  for (const g of groupsData.value ?? []) byGroup.set(g.uri, [])

  for (const t of talksData.value ?? []) {
    if (!inFilter(t)) continue
    const key = t.value.group?.uri ?? ''
    const bucket = byGroup.get(key)
    if (bucket) bucket.push(t)
  }

  for (const bucket of byGroup.values()) {
    bucket.sort((a, b) => b.value.date.localeCompare(a.value.date))
  }
  return byGroup
})

// Date-desc timeline. A group's `sortDate` is its freshest child talk,
// falling back to `createdAt` so empty groups surface at the top rather
// than vanishing to the bottom.
type TimelineEntry
  = | { kind: 'talk', sortDate: string, talk: TalkEntry }
    | { kind: 'group', sortDate: string, group: TalkGroupEntry, talks: TalkEntry[] }

const timeline = computed<TimelineEntry[]>(() => {
  const entries: TimelineEntry[] = []

  for (const talk of bucketed.value.get('') ?? []) {
    entries.push({ kind: 'talk', sortDate: talk.value.date, talk })
  }

  for (const group of groupsData.value ?? []) {
    const talks = bucketed.value.get(group.uri) ?? []
    const sortDate = talks[0]?.value.date ?? group.value.createdAt
    entries.push({ kind: 'group', sortDate, group, talks })
  }

  entries.sort((a, b) => b.sortDate.localeCompare(a.sortDate))
  return entries
})

async function putTalk (talk: TalkEntry, mutate: (value: TalkEntry['value']) => void) {
  const value = { ...talk.value }
  mutate(value)
  delete (value as Record<string, unknown>).$type
  await $fetch(`/api/admin/talks/${talk.rkey}`, { method: 'PUT', body: value })
  await refreshTalks()
}

async function makeGroupFromTalk (talk: TalkEntry) {
  if (!talk.value.title) return

  const created = await $fetch<{ rkey: string, uri: string, cid: string }>(
    '/api/admin/talk-groups',
    {
      method: 'POST',
      body: {
        title: talk.value.title,
        ...(talk.value.description ? { description: talk.value.description } : {}),
      },
    },
  )

  await putTalk(talk, v => {
    v.group = { uri: created.uri, cid: created.cid }
  })
  await refreshGroups()
}

// `targetUri` is the destination `<ul>`'s `data-target-uri`: a group's
// at:// URI, or empty string meaning "make this top-level".
function onDropped (talk: TalkEntry, targetUri: string) {
  if (targetUri) {
    if (talk.value.group?.uri === targetUri) return
    const target = (groupsData.value ?? []).find(g => g.uri === targetUri)
    if (!target) return
    putTalk(talk, v => {
      v.group = { uri: target.uri, cid: target.cid }
    })
  }
  else {
    if (!talk.value.group) return
    putTalk(talk, v => {
      delete v.group
    })
  }
}

function promoteToTopLevel (talk: TalkEntry) {
  if (!talk.value.group) return
  putTalk(talk, v => {
    delete v.group
  })
}

async function deleteTalk (talk: TalkEntry) {
  if (!confirm(`Delete "${talk.value.title || talk.value.source}"?`)) return
  await $fetch(`/api/admin/talks/${talk.rkey}`, { method: 'DELETE' })
  await refreshTalks()
}

async function deleteGroup (group: TalkGroupEntry) {
  const childCount = (bucketed.value.get(group.uri) ?? []).length
  const message = childCount
    ? `Delete group "${group.value.title}"? ${childCount} talk(s) in it will become top-level.`
    : `Delete group "${group.value.title}"?`
  if (!confirm(message)) return

  // Promote children to top-level first so their strong-refs don't dangle.
  const children = bucketed.value.get(group.uri) ?? []
  for (const child of children) {
    const value = { ...child.value }
    delete value.group
    delete (value as Record<string, unknown>).$type
    await $fetch(`/api/admin/talks/${child.rkey}`, { method: 'PUT', body: value })
  }
  await $fetch(`/api/admin/talk-groups/${group.rkey}`, { method: 'DELETE' })
  await Promise.all([refreshTalks(), refreshGroups()])
}

// Each top-level talk lives in its own single-item draggable list so
// the shared drag group works the same way as it does for in-group talks.
function singletonList (talk: TalkEntry): TalkEntry[] {
  return [talk]
}
</script>

<template>
  <AdminShell title="Talks">
    <div class="flex items-center gap-3 mb-6 flex-wrap">
      <div class="flex gap-1 text-sm">
        <button
          v-for="f in ['all', 'past', 'upcoming'] as const"
          :key="f"
          type="button"
          :class="filter === f ? 'bg-primary text-background' : 'bg-accent text-muted'"
          class="px-3 py-1 capitalize hover:opacity-80 transition-opacity"
          @click="filter = f"
        >
          {{ f }}
        </button>
      </div>
      <div class="ml-auto flex gap-2">
        <NuxtLink
          to="/admin/talk-groups/new"
          class="text-sm bg-accent text-primary px-3 py-1 hover:bg-accent/80 transition-colors"
        >
          New group
        </NuxtLink>
        <NuxtLink
          to="/admin/talks/new"
          class="text-sm bg-primary text-background px-3 py-1 hover:bg-primary/90 transition-colors"
        >
          New talk
        </NuxtLink>
      </div>
    </div>

    <p
      v-if="!timeline.length"
      class="text-muted text-sm"
    >
      No talks yet.
    </p>

    <div class="flex flex-col gap-6">
      <template
        v-for="entry in timeline"
        :key="entry.kind === 'group' ? entry.group.rkey : entry.talk.rkey"
      >
        <AdminTalkDraggable
          v-if="entry.kind === 'talk'"
          :talks="singletonList(entry.talk)"
          :top-level="true"
          @dropped="onDropped"
          @make-group="makeGroupFromTalk"
        />

        <section v-else>
          <header class="flex items-center gap-3 mb-2">
            <h2 class="text-lg">
              {{ entry.group.value.title }}
            </h2>
            <span
              v-if="entry.talks.length"
              class="text-xs text-muted"
            >
              most recent {{ formatter.format(new Date(entry.talks[0]!.value.date)) }}
            </span>
            <div class="ml-auto flex gap-3 text-sm">
              <NuxtLink
                :to="`/admin/talk-groups/${entry.group.rkey}`"
                class="text-muted hover:text-primary transition-colors"
              >
                Edit
              </NuxtLink>
              <button
                type="button"
                class="text-muted hover:text-red-500 transition-colors"
                @click="deleteGroup(entry.group)"
              >
                Delete
              </button>
            </div>
          </header>

          <AdminTalkDraggable
            :talks="entry.talks"
            :show-promote="true"
            :force-title-from-source="true"
            :target-uri="entry.group.uri"
            empty-hint="Drag talks here."
            @dropped="onDropped"
            @promote="promoteToTopLevel"
          />
        </section>
      </template>
    </div>

    <details
      v-if="talksData?.length"
      class="mt-8"
    >
      <summary class="text-xs text-muted cursor-pointer">
        Delete a talk
      </summary>
      <ul class="mt-2 text-sm divide-y divide-accent">
        <li
          v-for="talk in [...(talksData ?? [])].sort((a, b) => b.value.date.localeCompare(a.value.date))"
          :key="talk.rkey"
          class="py-2 flex items-center gap-3"
        >
          <span class="flex-grow truncate">{{ talk.value.title || talk.value.source }}</span>
          <button
            type="button"
            class="text-muted hover:text-red-500"
            @click="deleteTalk(talk)"
          >
            Delete
          </button>
        </li>
      </ul>
    </details>
  </AdminShell>
</template>
