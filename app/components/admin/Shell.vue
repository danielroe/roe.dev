<script setup lang="ts">
defineProps<{
  title?: string
}>()

const route = useRoute()

const nav = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'AMA', to: '/admin/ama' },
  { label: 'Talks', to: '/admin/talks' },
  { label: 'Uses', to: '/admin/uses' },
  { label: 'Entities', to: '/admin/entities' },
  { label: 'Invites', to: '/admin/invites' },
  { label: 'Location', to: '/admin/location' },
]

function isActive (to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <nav
      aria-label="admin"
      class="border-b border-accent"
    >
      <div class="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center gap-4">
        <NuxtLink
          to="/admin"
          class="text-lg font-medium"
        >
          admin
        </NuxtLink>
        <ul class="flex flex-wrap gap-4 text-sm list-none p-0 m-0">
          <li
            v-for="item in nav"
            :key="item.to"
          >
            <NuxtLink
              :to="item.to"
              :class="isActive(item.to) ? 'text-primary' : 'text-muted hover:text-primary'"
              class="transition-colors"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
        <form
          method="POST"
          action="/api/admin/auth/logout"
          class="ml-auto"
        >
          <button
            type="submit"
            class="text-sm text-muted hover:text-primary transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>

    <main class="flex-grow max-w-6xl w-full mx-auto px-4 md:px-8 py-6">
      <h1
        v-if="title"
        class="text-2xl mb-6"
      >
        {{ title }}
      </h1>
      <slot />
    </main>
  </div>
</template>
