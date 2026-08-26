<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

definePageMeta({ layout: false })
useHead({ title: 'New project category - admin - Daniel Roe' })

type ProjectCategoryValue = Omit<Loose<dev.roe.projectCategory.Main>, '$type'>

async function save (value: ProjectCategoryValue) {
  await $fetch('/api/admin/project-categories', { method: 'POST', body: value })
  await navigateTo('/admin/projects')
}
</script>

<template>
  <AdminShell title="New project category">
    <AdminProjectCategoryForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
