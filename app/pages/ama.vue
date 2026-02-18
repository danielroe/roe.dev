<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <main
      id="main-content"
      class="text-muted text-lg"
    >
      <form
        class="flex flex-col items-start py-8 gap-2"
        :class="{ 'opacity-50 pointer-events-none': status === 'pending' }"
        @submit.prevent="askQuestion"
      >
        <h1>
          <label
            for="question"
            class="text-2xl leading-none mt-[5vw] mb-[1vw] max-w-[37.50rem]"
          >
            ask me anything
          </label>
        </h1>
        <p>
          I'll try to
          <a
            class="underlined-link"
            href="https://bsky.app/hashtag/ama?author=danielroe.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            answer it on social media </a>.
        </p>
        <textarea
          id="question"
          v-model="questionText"
          name="question"
          rows="4"
          autocomplete="off"
          class="mt-2 rounded w-full max-w-400px min-h-[10ch] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-base f-ring-inset"
          :class="{
            'ring ring-yellow-600 dark:ring-yellow-500': denialDetected,
          }"
          :disabled="status === 'pending' || status === 'success'"
        />
        <div
          v-if="denialDetected"
          class="mt-2 text-sm text-yellow-600 dark:text-yellow-500"
        >
          <p>
            Did you mean
            <button
              type="button"
              class="underline font-medium hover:opacity-80 rounded f-ring px-1 py-0.5"
              @click="fixDenial"
            >
              "Daniel"
            </button>?
          </p>
        </div>
        <button
          type="submit"
          :disabled="status === 'pending' || status === 'success' || !questionText.trim()"
          class="underlined-link outline-none focus-visible:after:opacity-35 py-2 disabled:opacity-50"
        >
          <span
            v-if="status === 'pending'"
            class="i-svg-spinners:90-ring-with-bg h-4 w-4 mr-2"
            aria-hidden="true"
          />
          <template v-if="!denialDetected">
            ask anonymously
          </template>
          <template v-else>
            no, submit question anyway
          </template>
        </button>
      </form>
      <!-- Status announcements for screen readers -->
      <div
        aria-live="polite"
        aria-atomic="true"
        class="sr-only"
      >
        {{ statusMessage }}
      </div>
      <div
        v-if="status === 'success'"
        role="status"
      >
        <p>
          <span
            class="i-ri-checkbox-fill text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
          question submitted successfully!
        </p>
        <p>
          <NuxtLink
            to="/"
            class="underlined-link"
          >
            go home
          </NuxtLink>
        </p>
      </div>
      <p
        v-else-if="status === 'error'"
        role="alert"
        class="text-red-600 dark:text-red-400"
      >
        <span
          class="i-ri-error-warning-fill"
          aria-hidden="true"
        />
        an error occurred. Please try again.
      </p>
    </main>
  </div>
</template>

<script lang="ts" setup>
const status = ref<'idle' | 'pending' | 'error' | 'success'>('idle')

const denialDetected = ref(false)
const questionText = ref('')

const statusMessage = computed(() => {
  if (status.value === 'pending') return 'Submitting question...'
  if (status.value === 'success') return 'Question submitted successfully!'
  if (status.value === 'error') return 'Error submitting question. Please try again.'
  return ''
})

watchEffect(() => {
  denialDetected.value = /[Dd]enial/.test(questionText.value)
})

function fixDenial () {
  questionText.value = questionText.value.replace(/[Dd]enial/g, 'Daniel')
  denialDetected.value = false
}

async function askQuestion () {
  if (status.value === 'pending') return
  if (!questionText.value.trim()) return

  if (denialDetected.value) {
    status.value = 'idle'
    return
  }

  try {
    status.value = 'pending'

    await $fetch('/api/question', {
      method: 'POST',
      body: {
        question: questionText.value,
      },
    })

    status.value = 'success'
    questionText.value = ''
  }
  catch (error) {
    console.error(error)
    status.value = 'error'
  }
}
</script>
