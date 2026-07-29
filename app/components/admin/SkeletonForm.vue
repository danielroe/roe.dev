<script setup lang="ts">
/**
 * Placeholder form matching the admin form field markup (`text-sm` label
 * over a `bg-accent px-3 py-2` control), so a loading edit page occupies
 * exactly the same space as the form that replaces it.
 *
 * - `text`: single full-width field
 * - `pair`: two fields in the responsive two-column grid
 * - `textarea`: three-line control
 * - `checkbox`: checkbox + label row
 */
type FieldRow = 'text' | 'pair' | 'textarea' | 'checkbox'

withDefaults(defineProps<{
  fields: FieldRow[]
  widthClass?: string
}>(), {
  widthClass: 'max-w-lg',
})
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :class="widthClass"
    aria-hidden="true"
  >
    <template
      v-for="(field, i) in fields"
      :key="i"
    >
      <div
        v-if="field === 'text' || field === 'pair'"
        :class="field === 'pair' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''"
      >
        <div
          v-for="n in (field === 'pair' ? 2 : 1)"
          :key="n"
          class="flex flex-col gap-1 text-sm"
        >
          <span class="text-muted">
            <AdminSkeleton class="bg-accent w-24" />
          </span>
          <div class="bg-accent px-3 py-2 animate-pulse">
            <span class="invisible">&nbsp;</span>
          </div>
        </div>
      </div>

      <div
        v-else-if="field === 'textarea'"
        class="flex flex-col gap-1 text-sm"
      >
        <span class="text-muted">
          <AdminSkeleton class="bg-accent w-24" />
        </span>
        <div class="bg-accent px-3 py-2 animate-pulse">
          <span class="invisible block">&nbsp;</span>
          <span class="invisible block">&nbsp;</span>
          <span class="invisible block">&nbsp;</span>
        </div>
      </div>

      <div
        v-else
        class="flex items-center gap-2 text-sm"
      >
        <span class="inline-block h-3.5 w-3.5 bg-accent animate-pulse" />
        <AdminSkeleton class="bg-accent w-40" />
      </div>
    </template>

    <div class="flex gap-3">
      <div class="bg-accent px-4 py-2 animate-pulse">
        <span class="invisible">Save</span>
      </div>
    </div>
  </div>
</template>
