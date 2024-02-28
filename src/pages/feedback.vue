<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw] max-w-[37.50rem]">
      <h1 class="text-2xl">
        What do you think of Nuxt, in one word or one sentence?
      </h1>
    </header>
    <main class="text-muted text-lg">
      <form
        class="flex flex-col items-start py-8 gap-2"
        @submit.prevent="submitFeedback"
      >
        <textarea
          name="feedback"
          class="rounded w-full max-w-400px text-black px-3 py-1"
        />
        <button
          type="submit"
          class="underlined-link"
        >
          Submit
        </button>
      </form>
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Feedback' })

async function submitFeedback (event: Event) {
  const formData = new FormData(event.target as HTMLFormElement)
  await $fetch('/api/feedback', {
    method: 'POST',
    body: { feedback: formData.get('feedback') }
  })
  await navigateTo('/voted')
}
</script>
