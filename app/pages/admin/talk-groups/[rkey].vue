<script setup lang="ts">
import type { DevRoeTalkGroup } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'Edit talk group - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

type TalkGroupValue = Omit<DevRoeTalkGroup.Record, '$type'>

interface TalkGroupEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeTalkGroup.Record
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data } = await useFetch<TalkGroupEntry>(`/api/admin/talk-groups/${rkey.value}`, {
  watch: false,
})

async function save (value: TalkGroupValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/talk-groups/${rkey.value}`, { method: 'PUT', body: value })
  await navigateTo('/admin/talks')
}
</script>

<template>
  <AdminShell title="Edit talk group">
    <AdminTalkGroupForm
      v-if="data"
      :initial="data.value"
      submit-label="Save"
      @submit="save"
    />
  </AdminShell>
</template>
