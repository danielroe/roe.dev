<script setup lang="ts">
import type { UsesCategoryRecord } from '#shared/cms/records'

definePageMeta({ layout: false })
useHead({ title: 'New uses category - admin - Daniel Roe' })

type UsesCategoryValue = Omit<UsesCategoryRecord, '$type'>

async function save (value: UsesCategoryValue) {
  await $fetch('/api/admin/uses-categories', { method: 'POST', body: value })
  await navigateTo('/admin/uses')
}
</script>

<template>
  <AdminShell title="New uses category">
    <AdminUsesCategoryForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
