<script setup lang="ts">
import type { ProjectCategoryRecord } from '#shared/cms/records'

definePageMeta({ layout: false })
useHead({ title: 'New project category - admin - Daniel Roe' })

type ProjectCategoryValue = Omit<ProjectCategoryRecord, '$type'>

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
