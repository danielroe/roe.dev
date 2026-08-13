<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

definePageMeta({ layout: false })
useHead({ title: 'Location - admin - Daniel Roe' })

type LocationValue = Omit<Loose<dev.roe.location.Main>, '$type'>

interface LocationEntry {
  rkey: string
  uri: string
  cid: string
  value: dev.roe.location.Main
}

const { data, refresh, loading } = useAdminFetch<LocationEntry | null>('/api/admin/location')

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
      v-if="data === undefined && loading"
      :fields="['pair', 'pair', 'checkbox']"
    />
    <AdminLocationForm
      v-else
      :initial="data?.value"
      @submit="save"
    />
  </AdminShell>
</template>
