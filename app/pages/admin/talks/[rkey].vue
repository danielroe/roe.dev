<script setup lang="ts">
import type { DevRoeTalk } from '#shared/lex'

definePageMeta({ layout: false })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

useHead({ title: () => `Edit talk · admin` })

type TalkValue = Omit<DevRoeTalk.Record, '$type'>

interface TalkEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeTalk.Record
}

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data } = await useFetch<TalkEntry>(`/api/admin/talks/${rkey.value}`, {
  watch: false,
})

async function save (value: TalkValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/talks/${rkey.value}`, {
    method: 'PUT',
    body: value,
  })
  await navigateTo('/admin/talks')
}
</script>

<template>
  <AdminShell title="Edit talk">
    <AdminTalkForm
      v-if="data"
      :initial="data.value"
      submit-label="Save"
      @submit="save"
    />
  </AdminShell>
</template>
