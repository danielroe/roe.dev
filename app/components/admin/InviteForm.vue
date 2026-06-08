<script setup lang="ts">
interface InviteValue {
  slug: string
  repo: string
  isActive: boolean
  createdAt?: string
}

const props = defineProps<{
  initial?: Partial<InviteValue>
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', value: InviteValue): void
}>()

const form = reactive({
  slug: props.initial?.slug ?? '',
  repo: props.initial?.repo ?? '',
  isActive: props.initial?.isActive ?? true,
})

const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit () {
  error.value = null
  submitting.value = true
  try {
    const value: InviteValue = {
      slug: form.slug.trim(),
      repo: form.repo.trim(),
      isActive: form.isActive,
      ...(props.initial?.createdAt ? { createdAt: props.initial.createdAt } : {}),
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
      <span class="text-muted">Slug <span class="text-red-500">*</span></span>
      <input
        v-model="form.slug"
        required
        type="text"
        pattern="[a-zA-Z0-9_\-]+"
        class="bg-accent px-3 py-2"
      >
      <span class="text-xs text-muted">Becomes <code>roe.dev/&lt;slug&gt;</code>. Keep it secret; anyone with the URL gets the invite.</span>
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Repository <span class="text-red-500">*</span></span>
      <input
        v-model="form.repo"
        required
        type="text"
        placeholder="danielroe/example-repo"
        class="bg-accent px-3 py-2"
      >
    </label>

    <label class="flex items-center gap-2 text-sm">
      <input
        v-model="form.isActive"
        type="checkbox"
      >
      <span>Active</span>
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
        to="/admin/invites"
        class="text-muted hover:text-primary self-center text-sm"
      >
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>
