<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose, Strict } from '#shared/cms/strict'

type ProjectCategoryValue = Omit<Loose<Strict<dev.roe.projectCategory.Main>>, '$type'>

const props = defineProps<{
  initial?: Partial<ProjectCategoryValue>
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', value: ProjectCategoryValue): void
}>()

const form = reactive({
  title: props.initial?.title ?? '',
  order: props.initial?.order ?? 100,
})

const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit () {
  error.value = null
  submitting.value = true
  try {
    const value: ProjectCategoryValue = {
      title: form.title,
      order: form.order,
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

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="submitting"
        class="bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {{ submitting ? 'Saving…' : (submitLabel ?? 'Save') }}
      </button>
      <NuxtLink
        to="/admin/projects"
        class="text-muted hover:text-primary self-center text-sm"
      >
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>
