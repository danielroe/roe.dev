<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Edit invite - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

interface InviteEntry {
  rkey: string
  uri: string
  cid: string
  slug: string
  repo: string
  isActive: boolean
  createdAt: string
}

interface InviteValue {
  slug: string
  repo: string
  isActive: boolean
  createdAt?: string
}

const { data } = await useFetch<InviteEntry>(`/api/admin/invites/${rkey.value}`, {
  watch: false,
})

async function save (value: InviteValue) {
  if (!rkey.value) return
  await $fetch(`/api/admin/invites/${rkey.value}`, { method: 'PUT', body: value })
  await navigateTo('/admin/invites')
}
</script>

<template>
  <AdminShell title="Edit invite">
    <AdminInviteForm
      v-if="data"
      :initial="data"
      submit-label="Save"
      @submit="save"
    />
  </AdminShell>
</template>
