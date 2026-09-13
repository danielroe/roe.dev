<script setup lang="ts">
import type { ProjectRecord } from '#shared/cms/records'

definePageMeta({ layout: false })
useHead({ title: 'New project - admin - Daniel Roe' })

type ProjectValue = Omit<ProjectRecord, '$type'>

async function save (value: ProjectValue) {
  await $fetch('/api/admin/projects', { method: 'POST', body: value })
  await navigateTo('/admin/projects')
}
</script>

<template>
  <AdminShell title="New project">
    <AdminProjectForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
