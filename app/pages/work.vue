<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">
        what I'm working on
      </h1>
    </header>

    <main
      id="main-content"
      class="text-muted text-lg max-w-[37.50rem]"
    >
      <TheGithubRepos />
      <form
        v-if="$auth.user.sponsor"
        class="mt-4 mb-4 p-4 bg-gray-100 dark:bg-gray-900 text-primary flex md:flex-row flex-col gap-2"
        @submit.prevent="handleSubmission"
      >
        <label
          for="idea-input"
          class="flex md:flex-row flex-col gap-4 flex-grow md:items-center"
        >
          What should I build next?
          <input
            id="idea-input"
            v-model="ideaText"
            name="idea"
            type="text"
            autocomplete="off"
            :disabled="ideaStatus === 'submitting'"
            class="bg-gray-300 dark:bg-gray-600 text-primary text-sm px-2 py-1 flex-grow disabled:opacity-60 disabled:pointer-events-none rounded f-ring-inset"
          >
        </label>
        <button
          type="submit"
          :disabled="ideaStatus === 'submitting' || !ideaText.trim()"
          class="px-2 py-1 tracking-[0.15rem] text-sm uppercase rounded f-ring-accent disabled:opacity-50"
          :class="{
            'bg-green-200 dark:bg-green-900': ideaStatus === 'submitted',
            'bg-red-200 dark:bg-red-900': ideaStatus === 'error',
          }"
        >
          <span
            v-if="ideaStatus === 'submitting'"
            class="i-svg-spinners:90-ring-with-bg h-4 w-4 mr-1"
            aria-hidden="true"
          />
          {{
            ideaStatus === 'submitted'
              ? 'Done'
              : ideaStatus === 'error'
                ? 'Error'
                : 'Submit'
          }}
        </button>
        <div
          aria-live="polite"
          aria-atomic="true"
          class="sr-only"
        >
          {{ statusMessage }}
        </div>
      </form>
      <TheClientWork />
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Work' })

const ideaText = ref('')
const ideaStatus = ref<'ready' | 'submitting' | 'submitted' | 'error'>('ready')

const statusMessage = computed(() => {
  if (ideaStatus.value === 'submitting') return 'Submitting idea...'
  if (ideaStatus.value === 'submitted') return 'Idea submitted successfully!'
  if (ideaStatus.value === 'error') return 'Error submitting idea. Please try again.'
  return ''
})

async function handleSubmission () {
  if (!ideaText.value.trim()) return

  ideaStatus.value = 'submitting'
  try {
    await $fetch('/api/idea', {
      method: 'POST',
      body: { idea: ideaText.value },
    })
    ideaStatus.value = 'submitted'
    ideaText.value = ''
  }
  catch {
    ideaStatus.value = 'error'
  }
}
</script>
