<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'New invite - admin - Daniel Roe' })

interface InviteValue {
  slug: string
  repo: string
  isActive: boolean
}

async function save (value: InviteValue) {
  await $fetch('/api/admin/invites', { method: 'POST', body: value })
  await navigateTo('/admin/invites')
}
</script>

<template>
  <AdminShell title="New invite">
    <AdminInviteForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
