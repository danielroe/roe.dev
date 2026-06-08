<script setup lang="ts">
import type { DevRoeTalkGroup } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'New talk group - admin - Daniel Roe' })

type TalkGroupValue = Omit<DevRoeTalkGroup.Record, '$type'>

async function save (value: TalkGroupValue) {
  await $fetch('/api/admin/talk-groups', { method: 'POST', body: value })
  await navigateTo('/admin/talks')
}
</script>

<template>
  <AdminShell title="New talk group">
    <AdminTalkGroupForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
