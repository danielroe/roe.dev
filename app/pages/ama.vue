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
        <p>
          I'll try to <a
            class="underlined-link"
            href="https://bsky.app/hashtag/ama?author=danielroe.dev"
          >
            answer it on social media
          </a>.
        </p>
        <textarea
          id="question"
          name="question"
          class="mt-2 rounded w-full max-w-400px min-h-[10ch] text-black px-3 py-1"
          :class="{
            'ring ring-yellow-500': denialDetected,
          }"
        />
        <div class="mt-2 text-sm text-yellow-500">
          <p v-if="denialDetected">
            Did you mean "Daniel"?
          </p>
        </div>
        <button
          type="submit"
          :disabled="status === 'pending'"
          class="underlined-link"
        >
          <template v-if="!denialDetected">
            ask anonymously
          </template>
          <template v-else>
            no, submit question anyway
          </template>
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

const denialDetected = ref(false)

async function askQuestion (event: Event) {
  if (status.value === 'pending') return
  try {
    status.value = 'pending'

    const formData = new FormData(event.target as HTMLFormElement)
    const question = formData.get('question')?.toString()

    if (!denialDetected.value && question?.match(/[Dd]enial/g)) {
      denialDetected.value = true
      status.value = 'idle'
      return
    }
    else {
      denialDetected.value = false
    }

    await $fetch('/api/question', {
      method: 'POST',
      body: {
        question,
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
