<script setup lang="ts">
import type { TalkRecord } from '#shared/cms/records'

definePageMeta({ layout: false })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

useHead({ title: () => `Edit talk · admin` })

type TalkValue = Omit<TalkRecord, '$type'>

interface TalkEntry {
  rkey: string
  uri: string
  cid: string
  value: TalkRecord
}

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data, loading } = useAdminFetch<TalkEntry>(`/api/admin/talks/${rkey.value}`, {
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
    <AdminSkeletonForm
      v-else-if="loading"
      :fields="['text', 'textarea', 'pair', 'pair', 'pair', 'text', 'pair', 'pair', 'text', 'text']"
      width-class=""
    />
  </AdminShell>
</template>
