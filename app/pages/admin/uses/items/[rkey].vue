<script setup lang="ts">
import type { DevRoeUsesItem } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'Edit uses item - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

type UsesItemValue = Omit<DevRoeUsesItem.Record, '$type'>

interface ItemEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeUsesItem.Record
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data } = await useFetch<ItemEntry>(`/api/admin/uses-items/${rkey.value}`, {
  watch: false,
})

async function save (value: UsesItemValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/uses-items/${rkey.value}`, { method: 'PUT', body: value })
  await navigateTo('/admin/uses')
}
</script>

<template>
  <AdminShell title="Edit uses item">
    <AdminUsesItemForm
      v-if="data"
      :initial="data.value"
      submit-label="Save"
      @submit="save"
    />
  </AdminShell>
</template>
