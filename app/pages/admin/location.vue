<script setup lang="ts">
import type { DevRoeLocation } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'Location - admin - Daniel Roe' })

type LocationValue = Omit<DevRoeLocation.Record, '$type'>

interface LocationEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeLocation.Record
}

const { data, refresh, status } = useAdminFetch<LocationEntry | null>('/api/admin/location')

async function save (value: LocationValue) {
  await $fetch('/api/admin/location', {
    method: 'PUT',
    body: value,
  })
  await refresh()
}
</script>

<template>
  <AdminShell title="Location">
    <AdminSkeletonForm
      v-if="data === undefined && status === 'pending'"
      :fields="['pair', 'pair', 'checkbox']"
    />
    <AdminLocationForm
      v-else
      :initial="data?.value"
      @submit="save"
    />
  </AdminShell>
</template>
