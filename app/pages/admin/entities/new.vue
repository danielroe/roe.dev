<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

definePageMeta({ layout: false })
useHead({ title: 'New entity - admin - Daniel Roe' })

type EntityValue = Omit<Loose<dev.roe.entity.Main>, '$type'>

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
