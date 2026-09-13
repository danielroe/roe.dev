<script setup lang="ts">
import type { EntityRecord } from '#shared/cms/records'

definePageMeta({ layout: false })
useHead({ title: 'Edit entity - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

type EntityValue = Omit<EntityRecord, '$type'>

interface EntityEntry {
  rkey: string
  uri: string
  cid: string
  value: EntityRecord
}

const { data, loading } = useAdminFetch<EntityEntry>(`/api/admin/entities/${rkey.value}`, {
  watch: false,
})

async function save (value: EntityValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/entities/${rkey.value}`, { method: 'PUT', body: value })
  await navigateTo('/admin/entities')
}
</script>

<template>
  <AdminShell title="Edit entity">
    <AdminEntityForm
      v-if="data"
      :initial="data.value"
      submit-label="Save"
      @submit="save"
    />
    <AdminSkeletonForm
      v-else-if="loading"
      :fields="['text', 'text', 'text', 'text', 'text']"
    />
  </AdminShell>
</template>
