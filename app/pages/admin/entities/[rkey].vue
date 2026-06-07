<script setup lang="ts">
import type { DevRoeEntity } from '#shared/lex'

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

type EntityValue = Omit<DevRoeEntity.Record, '$type'>

interface EntityEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeEntity.Record
}

const { data } = await useFetch<EntityEntry>(`/api/admin/entities/${rkey.value}`, {
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
  </AdminShell>
</template>
