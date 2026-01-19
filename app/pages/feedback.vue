<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <main
      id="main-content"
      class="text-muted text-lg"
    >
      <form
        class="flex flex-col items-start py-8 gap-2"
        @submit.prevent="submitFeedback"
      >
        <label
          for="feedback"
          class="text-2xl leading-none mt-[5vw] mb-[1vw] max-w-[37.50rem]"
        >
          What do you think, in one word or one sentence?
        </label>
        <textarea
          id="feedback"
          v-model="feedback"
          name="feedback"
          rows="3"
          autocomplete="off"
          class="rounded w-full max-w-400px bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-base f-ring-inset"
          :disabled="status === 'pending'"
        />
        <div class="flex items-center gap-3">
          <button
            type="submit"
            class="underlined-link outline-none focus-visible:after:opacity-35 py-2 disabled:opacity-50"
            :disabled="status === 'pending' || !feedback.trim()"
          >
            <span
              v-if="status === 'pending'"
              class="i-svg-spinners:90-ring-with-bg h-4 w-4 mr-2"
              aria-hidden="true"
            />
            Submit
          </button>
        </div>
        <div
          aria-live="polite"
          aria-atomic="true"
          class="sr-only"
        >
          {{ statusMessage }}
        </div>
        <p
          v-if="status === 'error'"
          role="alert"
          class="text-red-600 dark:text-red-400 text-sm"
        >
          Something went wrong. Please try again.
        </p>
      </form>
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Feedback' })

const feedback = ref('')
const status = ref<'idle' | 'pending' | 'error'>('idle')

const statusMessage = computed(() => {
  if (status.value === 'pending') return 'Submitting feedback...'
  if (status.value === 'error') return 'Error submitting feedback. Please try again.'
  return ''
})

async function submitFeedback () {
  if (!feedback.value.trim()) return

  status.value = 'pending'
  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: { feedback: feedback.value },
    })
    await navigateTo('/voted')
  }
  catch {
    status.value = 'error'
  }
}
</script>
