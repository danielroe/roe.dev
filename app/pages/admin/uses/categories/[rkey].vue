<script setup lang="ts">
import type { DevRoeUsesCategory } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'Edit uses category - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

type UsesCategoryValue = Omit<DevRoeUsesCategory.Record, '$type'>

interface CategoryEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeUsesCategory.Record
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data } = await useFetch<CategoryEntry>(`/api/admin/uses-categories/${rkey.value}`, {
  watch: false,
})

async function save (value: UsesCategoryValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/uses-categories/${rkey.value}`, { method: 'PUT', body: value })
  await navigateTo('/admin/uses')
}
</script>

<template>
  <AdminShell title="Edit uses category">
    <AdminUsesCategoryForm
      v-if="data"
      :initial="data.value"
      submit-label="Save"
      @submit="save"
    />
  </AdminShell>
</template>
