<script setup lang="ts">
import type { TalkRecord } from '#shared/cms/records'

definePageMeta({ layout: false })
useHead({ title: 'New talk - admin - Daniel Roe' })

type TalkValue = Omit<TalkRecord, '$type'>

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
