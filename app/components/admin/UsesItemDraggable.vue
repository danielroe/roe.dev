<script setup lang="ts">
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import type { DevRoeUsesItem } from '#shared/lex'

interface ItemEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeUsesItem.Record
}

const props = defineProps<{
  items: ItemEntry[]
}>()

const emit = defineEmits<{
  (e: 'reorder', items: ItemEntry[]): void
  (e: 'remove', rkey: string, name: string): void
}>()

const [parent, values] = useDragAndDrop<ItemEntry>([...props.items], {
  dragHandle: '[data-drag-handle]',
})

watch(() => props.items, next => {
  // Sync local list when the parent re-fetches (e.g. after a save).
  values.value = [...next]
})

// Emit reorder when the order actually changes vs incoming props.
watch(values, next => {
  const before = props.items.map(i => i.rkey).join(',')
  const after = next.map(i => i.rkey).join(',')
  if (before !== after) emit('reorder', next)
}, { deep: false })
</script>

<template>
  <ul
    ref="parent"
    class="flex flex-col gap-2"
  >
    <li
      v-for="item in values"
      :key="item.rkey"
      class="flex items-center gap-3 bg-accent px-3 py-2"
    >
      <span
        data-drag-handle
        class="cursor-grab text-muted select-none"
      >
        <span aria-hidden="true">⋮⋮</span>
        <span class="sr-only">Drag to reorder</span>
      </span>
      <div class="flex-grow min-w-0">
        <NuxtLink
          :to="`/admin/uses/items/${item.rkey}`"
          class="block underline-offset-4 hover:underline truncate"
        >
          {{ item.value.name }}
        </NuxtLink>
        <div
          v-if="item.value.description"
          class="text-sm text-muted truncate"
        >
          {{ item.value.description }}
        </div>
      </div>
      <button
        type="button"
        class="text-sm text-muted hover:text-red-500 transition-colors"
        @click="emit('remove', item.rkey, item.value.name)"
      >
        Delete
      </button>
    </li>
  </ul>
  <p
    v-if="!values.length"
    class="text-muted text-xs"
  >
    No items in this category.
  </p>
</template>
