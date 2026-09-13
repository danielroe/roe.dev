<script setup lang="ts">
import type { EntityRecord } from '#shared/cms/records'

definePageMeta({ layout: false })
useHead({ title: 'New entity - admin - Daniel Roe' })

type EntityValue = Omit<EntityRecord, '$type'>

async function save (value: EntityValue) {
  await $fetch('/api/admin/entities', { method: 'POST', body: value })
  await navigateTo('/admin/entities')
}
</script>

<template>
  <AdminShell title="New entity">
    <AdminEntityForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
