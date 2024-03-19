<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <main class="text-muted text-lg">
      <form
        class="flex flex-col items-start py-8 gap-2"
        @submit.prevent="submitFeedback"
      >
        <label
          for="feedback"
          class="text-2xl leading-none mt-[5vw] mb-[1vw] max-w-[37.50rem]"
        >
          What do you think of Nuxt, in one word or one sentence?
        </label>
        <textarea
          id="feedback"
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
    body: { feedback: formData.get('feedback') },
  })
  await navigateTo('/voted')
}
</script>
