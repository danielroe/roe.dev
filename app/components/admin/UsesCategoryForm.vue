<script setup lang="ts">
import type { DevRoeUsesCategory } from '#shared/lex'
import type { Strict } from '#shared/cms/strict'

type UsesCategoryValue = Omit<Strict<DevRoeUsesCategory.Record>, '$type'>

const props = defineProps<{
  initial?: Partial<UsesCategoryValue>
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', value: UsesCategoryValue): void
}>()

const form = reactive({
  title: props.initial?.title ?? '',
  order: props.initial?.order ?? 100,
  displayAsGrid: props.initial?.displayAsGrid ?? false,
})

const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit () {
  error.value = null
  submitting.value = true
  try {
    const value: UsesCategoryValue = {
      title: form.title,
      order: form.order,
      displayAsGrid: form.displayAsGrid,
      ...(props.initial?.createdAt ? { createdAt: props.initial.createdAt } : { createdAt: new Date().toISOString() }),
    }
    emit('submit', value)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-4 max-w-lg"
    @submit.prevent="onSubmit"
  >
    <p
      v-if="error"
      class="text-sm text-red-500"
    >
      {{ error }}
    </p>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Title <span class="text-red-500">*</span></span>
      <input
        v-model="form.title"
        required
        type="text"
        class="bg-accent px-3 py-2"
      >
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Order</span>
      <input
        v-model.number="form.order"
        type="number"
        class="bg-accent px-3 py-2"
      >
      <span class="text-xs text-muted">Lower numbers render first. Defaults to 100.</span>
    </label>

    <label class="flex items-center gap-2 text-sm">
      <input
        v-model="form.displayAsGrid"
        type="checkbox"
      >
      <span>Display items as a grid (with images) rather than a list</span>
    </label>

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="submitting"
        class="bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {{ submitting ? 'Saving…' : (submitLabel ?? 'Save') }}
      </button>
      <NuxtLink
        to="/admin/uses"
        class="text-muted hover:text-primary self-center text-sm"
      >
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>
