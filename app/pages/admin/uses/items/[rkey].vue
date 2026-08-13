<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

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

type UsesItemValue = Omit<Loose<dev.roe.usesItem.Main>, '$type'>

interface ItemEntry {
  rkey: string
  uri: string
  cid: string
  value: dev.roe.usesItem.Main
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data, loading } = useAdminFetch<ItemEntry>(`/api/admin/uses-items/${rkey.value}`, {
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
    <AdminSkeletonForm
      v-else-if="loading"
      :fields="['text', 'text', 'textarea', 'text', 'text']"
      width-class="max-w-2xl"
    />
  </AdminShell>
</template>
