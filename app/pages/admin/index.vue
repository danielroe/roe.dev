<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ title: 'admin' })

const { data: stats, status } = useAdminFetch<{
  talks: number
  talkGroups: number
  usesCategories: number
  usesItems: number
  hasLocation: boolean
}>('/api/admin/stats')

const showSkeleton = computed(() => status.value === 'pending' && !stats.value)

const cards = computed(() => [
  { label: 'Talks', value: stats.value?.talks ?? 0, to: '/admin/talks' },
  { label: 'Talk groups', value: stats.value?.talkGroups ?? 0, to: '/admin/talks' },
  { label: 'Uses categories', value: stats.value?.usesCategories ?? 0, to: '/admin/uses' },
  { label: 'Uses items', value: stats.value?.usesItems ?? 0, to: '/admin/uses' },
  { label: 'Location', value: stats.value?.hasLocation ? 'set' : 'not set', to: '/admin/location' },
])
</script>

<template>
  <AdminShell title="Dashboard">
    <ul
      v-if="showSkeleton"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
      aria-hidden="true"
    >
      <li
        v-for="i in 5"
        :key="i"
      >
        <div class="block bg-accent p-6">
          <div class="text-muted text-sm">
            <AdminSkeleton class="bg-muted/20 w-20" />
          </div>
          <div class="text-3xl mt-2">
            <AdminSkeleton class="bg-muted/20 w-12" />
          </div>
        </div>
      </li>
    </ul>
    <ul
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
    >
      <li
        v-for="card in cards"
        :key="card.label"
      >
        <NuxtLink
          :to="card.to"
          class="block bg-accent p-6 hover:bg-accent/80 transition-colors"
        >
          <div class="text-muted text-sm">
            {{ card.label }}
          </div>
          <div class="text-3xl mt-2">
            {{ card.value }}
          </div>
        </NuxtLink>
      </li>
    </ul>
  </AdminShell>
</template>
