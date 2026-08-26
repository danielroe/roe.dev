<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

definePageMeta({ layout: false })
useHead({ title: 'New project - admin - Daniel Roe' })

type ProjectValue = Omit<Loose<dev.roe.project.Main>, '$type'>

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
