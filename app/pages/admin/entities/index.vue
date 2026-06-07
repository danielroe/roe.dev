<script setup lang="ts">
import type { DevRoeEntity } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'Entities - admin - Daniel Roe' })

interface EntityEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeEntity.Record
}

const { data, refresh } = await useFetch<EntityEntry[]>('/api/admin/entities', { default: () => [] })

async function remove (rkey: string, name: string) {
  if (!confirm(`Delete entity "${name}"?`)) return
  await $fetch(`/api/admin/entities/${rkey}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <AdminShell title="Entities">
    <div class="flex items-center mb-4">
      <NuxtLink
        to="/admin/entities/new"
        class="ml-auto text-sm bg-primary text-background px-3 py-1 hover:bg-primary/90 transition-colors"
      >
        New entity
      </NuxtLink>
    </div>

    <ul class="divide-y divide-accent">
      <li
        v-for="entity in data"
        :key="entity.rkey"
        class="py-3 flex items-center gap-4"
      >
        <div class="flex-grow min-w-0">
          <NuxtLink
            :to="`/admin/entities/${entity.rkey}`"
            class="block underline-offset-4 hover:underline truncate"
          >
            {{ entity.value.name }}
          </NuxtLink>
          <div class="text-sm text-muted truncate">
            {{ entity.value.socialHandles?.bluesky ? `@${entity.value.socialHandles.bluesky}` : '' }}
            {{ entity.value.website || '' }}
          </div>
        </div>
        <button
          type="button"
          class="text-sm text-muted hover:text-red-500 transition-colors"
          @click="remove(entity.rkey, entity.value.name)"
        >
          Delete
        </button>
      </li>
    </ul>

    <p
      v-if="!data?.length"
      class="text-muted text-sm"
    >
      No entities yet.
    </p>
  </AdminShell>
</template>
