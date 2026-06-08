<script setup lang="ts">
/**
 * Draggable list of talks. Sibling instances share a drag group so talks
 * can be moved between groups, or between top-level slots and groups,
 * via drag-and-drop. The parent page persists the change and re-fetches
 * the canonical date-sorted order; this component is a UI shell.
 */
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import type { DevRoeTalk } from '#shared/lex'

export interface TalkEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeTalk.Record
}

const props = defineProps<{
  talks: TalkEntry[]
  emptyHint?: string
  /** Show a "Remove from group" button on each row. */
  showPromote?: boolean
  /** Use the talk's `source` as the row headline instead of `title`. */
  forceTitleFromSource?: boolean
  /**
   * This list is a single-item top-level row in the timeline: items can
   * be dragged *out*, but no other talk can be dropped *onto* it.
   */
  topLevel?: boolean
  /** Stamped on the rendered `<ul>` so other lists' `onDragend` can read the destination. */
  targetUri?: string
}>()

const emit = defineEmits<{
  /**
   * Fired by the source list once the user releases. `targetUri` is the
   * destination `<ul>`'s `data-target-uri`; empty string means a
   * top-level slot (i.e. "remove the talk's group").
   */
  'dropped': [talk: TalkEntry, targetUri: string]
  /** Remove the talk's group ref (in-group row only). */
  'promote': [talk: TalkEntry]
  /** Seed a new group from this talk's title/description (top-level row only). */
  'make-group': [talk: TalkEntry]
}>()

const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

// Cross-list transfers only: talks are date-sorted server-side, so
// letting the user reorder within a list would lie about persistence.
// `dropZone: false` on top-level singletons rejects incoming drops
// while still allowing outgoing drags (`accepts: false` would block both).
const [parent, values] = useDragAndDrop<TalkEntry>([...props.talks], {
  group: 'admin-talks',
  dragHandle: '[data-drag-handle]',
  dropZone: !props.topLevel,
  performSort: () => {},
  onDragend: data => {
    const moved = data.draggedNode?.data.value as TalkEntry | undefined
    if (!moved) return
    const destEl = data.parent.el as HTMLElement
    const sourceEl = parent.value as HTMLElement | null
    if (destEl === sourceEl) return
    emit('dropped', moved, destEl?.dataset?.targetUri ?? '')
  },
})

watch(() => props.talks, next => {
  values.value = [...next]
}, { deep: false })

function rowTitle (talk: TalkEntry): string {
  if (props.forceTitleFromSource) return talk.value.source || talk.value.title || ''
  return talk.value.title || talk.value.source || ''
}
</script>

<template>
  <ul
    ref="parent"
    class="flex flex-col gap-2 min-h-12"
    :data-target-uri="targetUri ?? ''"
  >
    <li
      v-for="talk in values"
      :key="talk.rkey"
      class="flex items-center gap-3 bg-accent px-3 py-2"
    >
      <span
        data-drag-handle
        class="cursor-grab text-muted select-none"
      >
        <span aria-hidden="true">⋮⋮</span>
        <span class="sr-only">Drag to move between groups</span>
      </span>
      <div class="flex-grow min-w-0">
        <NuxtLink
          :to="`/admin/talks/${talk.rkey}`"
          class="block underline-offset-4 hover:underline truncate"
        >
          {{ rowTitle(talk) }}
        </NuxtLink>
        <div class="text-xs text-muted truncate">
          {{ formatter.format(new Date(talk.value.date)) }}<template v-if="!forceTitleFromSource && talk.value.source">
            · {{ talk.value.source }}
          </template> · {{ talk.value.type }}
        </div>
      </div>
      <button
        v-if="showPromote"
        type="button"
        class="text-xs text-muted hover:text-primary transition-colors"
        @click="emit('promote', talk)"
      >
        Remove from group
      </button>
      <button
        v-else-if="talk.value.title"
        type="button"
        class="text-xs text-muted hover:text-primary transition-colors"
        title="Create a talk group seeded with this talk's title and description"
        @click="emit('make-group', talk)"
      >
        Make group
      </button>
    </li>
  </ul>
  <p
    v-if="!values.length && emptyHint"
    class="text-muted text-xs pl-3"
  >
    {{ emptyHint }}
  </p>
</template>
