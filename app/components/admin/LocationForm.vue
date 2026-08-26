<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose, Strict } from '#shared/cms/strict'

type LocationValue = Omit<Loose<Strict<dev.roe.location.Main>>, '$type'>

const props = defineProps<{
  initial?: Partial<LocationValue>
}>()

const emit = defineEmits<{
  (e: 'submit', value: LocationValue): void
}>()

const form = reactive({
  city: props.initial?.address?.locality ?? '',
  region: props.initial?.address?.region ?? '',
  countryCode: props.initial?.address?.country ?? '',
  meetupAvailable: props.initial?.meetupAvailable ?? true,
})

const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit () {
  error.value = null
  submitting.value = true
  try {
    const value: LocationValue = {
      address: {
        $type: 'community.lexicon.location.address',
        country: form.countryCode.toUpperCase(),
        ...(form.region ? { region: form.region } : {}),
        locality: form.city,
      },
      meetupAvailable: form.meetupAvailable,
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

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">City <span class="text-red-500">*</span></span>
        <input
          v-model="form.city"
          required
          type="text"
          class="bg-accent px-3 py-2"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Region / state</span>
        <input
          v-model="form.region"
          type="text"
          class="bg-accent px-3 py-2"
        >
      </label>
    </div>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Country code (ISO 3166-1 alpha-2) <span class="text-red-500">*</span></span>
      <input
        v-model="form.countryCode"
        required
        type="text"
        minlength="2"
        maxlength="2"
        pattern="[A-Za-z]{2}"
        class="bg-accent px-3 py-2 uppercase"
      >
      <span class="text-xs text-muted">The country name shown on the site is derived from this code.</span>
    </label>

    <label class="flex items-center gap-2 text-sm">
      <input
        v-model="form.meetupAvailable"
        type="checkbox"
      >
      <span>Available for meetups</span>
    </label>

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="submitting"
        class="bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {{ submitting ? 'Saving…' : 'Save' }}
      </button>
    </div>
  </form>
</template>
