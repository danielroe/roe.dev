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

const { data, refresh, status } = useAdminFetch<InviteEntry[]>('/api/admin/invites', { default: () => [] })

const showSkeleton = computed(() => status.value === 'pending' && !data.value.length)

async function remove (rkey: string, slug: string) {
  if (!confirm(`Delete invite "${slug}"?`)) return
  const previous = data.value
  data.value = data.value.filter(i => i.rkey !== rkey)
  try {
    await $fetch(`/api/admin/invites/${rkey}`, { method: 'DELETE' })
    refresh()
  }
  catch (error) {
    data.value = previous
    throw error
  }
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

    <AdminSkeletonRows v-if="showSkeleton" />
    <ul
      v-else
      class="divide-y divide-accent"
    >
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
      v-if="!showSkeleton && !data?.length"
      class="text-muted text-sm"
    >
      No invites yet.
    </p>
  </AdminShell>
</template>
