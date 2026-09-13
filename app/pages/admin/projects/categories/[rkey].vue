<script setup lang="ts">
import type { ProjectCategoryRecord } from '#shared/cms/records'

definePageMeta({ layout: false })
useHead({ title: 'Edit project category - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

type ProjectCategoryValue = Omit<ProjectCategoryRecord, '$type'>

interface CategoryEntry {
  rkey: string
  uri: string
  cid: string
  value: ProjectCategoryRecord
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data, loading } = useAdminFetch<CategoryEntry>(`/api/admin/project-categories/${rkey.value}`, {
  watch: false,
})

async function save (value: ProjectCategoryValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/project-categories/${rkey.value}`, { method: 'PUT', body: value })
  await navigateTo('/admin/projects')
}
</script>

<template>
  <AdminShell title="Edit project category">
    <AdminProjectCategoryForm
      v-if="data"
      :initial="data.value"
      submit-label="Save"
      @submit="save"
    />
    <AdminSkeletonForm
      v-else-if="loading"
      :fields="['text', 'text']"
    />
  </AdminShell>
</template>
