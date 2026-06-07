<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Invites - admin - Daniel Roe' })

interface InviteEntry {
  rkey: string
  uri: string
  cid: string
  slug: string
  repo: string
  isActive: boolean
  createdAt: string
}

const { data, refresh } = await useFetch<InviteEntry[]>('/api/admin/invites', { default: () => [] })

async function remove (rkey: string, slug: string) {
  if (!confirm(`Delete invite "${slug}"?`)) return
  await $fetch(`/api/admin/invites/${rkey}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <AdminShell title="Invites">
    <div class="flex items-center mb-4">
      <NuxtLink
        to="/admin/invites/new"
        class="ml-auto text-sm bg-primary text-background px-3 py-1 hover:bg-primary/90 transition-colors"
      >
        New invite
      </NuxtLink>
    </div>

    <ul class="divide-y divide-accent">
      <li
        v-for="invite in data"
        :key="invite.rkey"
        class="py-3 flex items-center gap-4"
      >
        <div class="flex-grow min-w-0">
          <NuxtLink
            :to="`/admin/invites/${invite.rkey}`"
            class="block underline-offset-4 hover:underline truncate"
          >
            /{{ invite.slug }}
            <span
              v-if="!invite.isActive"
              class="text-xs text-muted"
            >(inactive)</span>
          </NuxtLink>
          <div class="text-sm text-muted truncate">
            → {{ invite.repo }}
          </div>
        </div>
        <button
          type="button"
          class="text-sm text-muted hover:text-red-500 transition-colors"
          @click="remove(invite.rkey, invite.slug)"
        >
          Delete
        </button>
      </li>
    </ul>

    <p
      v-if="!data?.length"
      class="text-muted text-sm"
    >
      No invites yet.
    </p>
  </AdminShell>
</template>
