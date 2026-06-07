<script setup lang="ts">
import type { DevRoeEntity } from '#shared/lex'
import type { Strict } from '#shared/cms/strict'

type EntityValue = Omit<Strict<DevRoeEntity.Record>, '$type'>

const props = defineProps<{
  initial?: Partial<EntityValue>
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', value: EntityValue): void
}>()

const form = reactive({
  name: props.initial?.name ?? '',
  bluesky: props.initial?.socialHandles?.bluesky ?? '',
  linkedin: props.initial?.socialHandles?.linkedin ?? '',
  mastodon: props.initial?.socialHandles?.mastodon ?? '',
  website: props.initial?.website ?? '',
})

const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit () {
  error.value = null
  submitting.value = true
  try {
    const socialHandles = {
      ...(form.bluesky ? { bluesky: form.bluesky.replace(/^@/, '') } : {}),
      ...(form.linkedin ? { linkedin: form.linkedin } : {}),
      ...(form.mastodon ? { mastodon: form.mastodon.replace(/^@/, '') } : {}),
    }
    const value: EntityValue = {
      name: form.name,
      ...(Object.keys(socialHandles).length ? { socialHandles } : {}),
      ...(form.website ? { website: form.website } : {}),
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
      <span class="text-muted">Name <span class="text-red-500">*</span></span>
      <input
        v-model="form.name"
        required
        type="text"
        class="bg-accent px-3 py-2"
      >
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Bluesky handle</span>
      <input
        v-model="form.bluesky"
        type="text"
        placeholder="nuxt.bsky.social"
        class="bg-accent px-3 py-2"
      >
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">LinkedIn handle</span>
      <input
        v-model="form.linkedin"
        type="text"
        placeholder="nuxtjs"
        class="bg-accent px-3 py-2"
      >
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Mastodon handle</span>
      <input
        v-model="form.mastodon"
        type="text"
        placeholder="nuxt@fosstodon.org"
        class="bg-accent px-3 py-2"
      >
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Website</span>
      <input
        v-model="form.website"
        type="url"
        class="bg-accent px-3 py-2"
      >
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
        to="/admin/entities"
        class="text-muted hover:text-primary self-center text-sm"
      >
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>
