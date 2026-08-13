<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

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

type UsesCategoryValue = Omit<Loose<dev.roe.usesCategory.Main>, '$type'>

interface CategoryEntry {
  rkey: string
  uri: string
  cid: string
  value: dev.roe.usesCategory.Main
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data, loading } = useAdminFetch<CategoryEntry>(`/api/admin/uses-categories/${rkey.value}`, {
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
    <AdminSkeletonForm
      v-else-if="loading"
      :fields="['text', 'text', 'checkbox']"
    />
  </AdminShell>
</template>
