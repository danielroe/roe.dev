<script setup lang="ts">
import type { DevRoeTalk } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'New talk - admin - Daniel Roe' })

type TalkValue = Omit<DevRoeTalk.Record, '$type'>

async function save (value: TalkValue) {
  const res = await $fetch<{ rkey: string }>('/api/admin/talks', {
    method: 'POST',
    body: value,
  })
  await navigateTo(`/admin/talks/${res.rkey}`)
}
</script>

<template>
  <AdminShell title="New talk">
    <AdminTalkForm
      submit-label="Create"
      @submit="save"
    />
  </AdminShell>
</template>
