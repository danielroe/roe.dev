<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

definePageMeta({ layout: false })
useHead({ title: 'New uses item - admin - Daniel Roe' })

type UsesItemValue = Omit<Loose<dev.roe.usesItem.Main>, '$type'>

async function save (value: UsesItemValue) {
  await $fetch('/api/admin/uses-items', { method: 'POST', body: value })
  await navigateTo('/admin/uses')
}
</script>

<template>
  <AdminShell title="New uses item">
    <AdminUsesItemForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
