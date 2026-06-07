<script setup lang="ts">
import type { DevRoeEntity } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'New entity - admin - Daniel Roe' })

type EntityValue = Omit<DevRoeEntity.Record, '$type'>

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
