<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

definePageMeta({ layout: false })
useHead({ title: 'Edit project - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

type ProjectValue = Omit<Loose<dev.roe.project.Main>, '$type'>

interface ProjectEntry {
  rkey: string
  uri: string
  cid: string
  value: dev.roe.project.Main
}

// `watch: false` stops useFetch firing one last `/.../undefined` request
// when `navigateTo` clears `route.params.rkey` on unmount.
const { data, loading } = useAdminFetch<ProjectEntry>(`/api/admin/projects/${rkey.value}`, {
  watch: false,
})

async function save (value: ProjectValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/projects/${rkey.value}`, { method: 'PUT', body: value })
  await navigateTo('/admin/projects')
}
</script>

<template>
  <AdminShell title="Edit project">
    <AdminProjectForm
      v-if="data"
      :initial="data.value"
      submit-label="Save"
      @submit="save"
    />
    <AdminSkeletonForm
      v-else-if="loading"
      :fields="['text', 'text', 'textarea', 'text', 'text', 'text', 'checkbox', 'text']"
      width-class="max-w-2xl"
    />
  </AdminShell>
</template>
