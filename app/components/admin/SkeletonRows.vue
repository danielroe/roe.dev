<script setup lang="ts">
/**
 * Placeholder list rows matching the two admin list shapes:
 *
 * - `plain`: `divide-y` rows (`py-3`, title line + meta line + action),
 *   as used by the entities / invites / AMA indexes.
 * - `card`: draggable-style rows (`bg-accent px-3 py-2`, drag handle,
 *   title line + `text-xs` meta line), as used by talks / uses.
 */
withDefaults(defineProps<{
  rows?: number
  variant?: 'plain' | 'card'
  meta?: 'sm' | 'xs'
  align?: 'center' | 'start'
}>(), {
  rows: 5,
  variant: 'plain',
  meta: 'sm',
  align: 'center',
})

const widths = ['w-2/5', 'w-1/4', 'w-1/3', 'w-1/2']
</script>

<template>
  <ul
    v-if="variant === 'plain'"
    class="divide-y divide-accent"
    aria-hidden="true"
  >
    <li
      v-for="i in rows"
      :key="i"
      class="py-3 flex gap-4"
      :class="align === 'center' ? 'items-center' : 'items-start'"
    >
      <div class="flex-grow min-w-0">
        <div class="block">
          <AdminSkeleton
            class="bg-accent"
            :class="widths[(i - 1) % widths.length]"
          />
        </div>
        <div :class="meta === 'sm' ? 'text-sm' : 'text-xs mt-1'">
          <AdminSkeleton class="bg-accent w-1/2" />
        </div>
      </div>
      <span class="text-sm">
        <AdminSkeleton class="bg-accent w-10" />
      </span>
    </li>
  </ul>

  <ul
    v-else
    class="flex flex-col gap-2"
    aria-hidden="true"
  >
    <li
      v-for="i in rows"
      :key="i"
      class="flex items-center gap-3 bg-accent px-3 py-2"
    >
      <span class="text-muted select-none">
        <span class="invisible">⋮⋮</span>
      </span>
      <div class="flex-grow min-w-0">
        <div class="block">
          <AdminSkeleton
            class="bg-muted/20"
            :class="widths[(i - 1) % widths.length]"
          />
        </div>
        <div :class="meta === 'sm' ? 'text-sm' : 'text-xs'">
          <AdminSkeleton class="bg-muted/20 w-1/3" />
        </div>
      </div>
      <span :class="meta === 'sm' ? 'text-sm' : 'text-xs'">
        <AdminSkeleton class="bg-muted/20 w-8" />
      </span>
    </li>
  </ul>
</template>
