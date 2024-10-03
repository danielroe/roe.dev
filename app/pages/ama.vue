<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <main class="text-muted text-lg">
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
        <textarea
          id="question"
          name="question"
          class="rounded w-full max-w-400px min-h-[10ch] text-black px-3 py-1"
        />
        <button
          type="submit"
          :disabled="status === 'pending'"
          class="underlined-link"
        >
          ask anonymously
        </button>
      </form>
      <template v-if="status === 'success'">
        <p>
          <i class="i-ri-checkbox-fill" /> question submitted successfully!
        </p>
        <p>
          <NuxtLink
            to="/"
            class="underlined-link"
          >
            go home
          </NuxtLink>
        </p>
      </template>
      <p v-else-if="status === 'error'">
        <i class="i-ri-error-warning-fill" /> an error occurred
      </p>
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Ask me anything' })

const status = ref<'idle' | 'pending' | 'error' | 'success'>('idle')

async function askQuestion (event: Event) {
  if (status.value === 'pending') return
  try {
    status.value = 'pending'

    const formData = new FormData(event.target as HTMLFormElement)
    await $fetch('/api/question', {
      method: 'POST',
      body: {
        question: formData.get('question'),
      },
    })
    status.value = 'success'
  }
  catch (error) {
    console.error(error)
    status.value = 'error'
  }
}
</script>
