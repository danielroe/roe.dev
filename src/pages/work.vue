<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[37.50rem]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Work</h1>
    </header>

    <main class="text-muted text-lg">
      <TheGithubRepos />
      <form
        v-if="$auth.user.sponsor"
        class="mt-4 mb-4 p-4 bg-gray-900 text-white flex md:flex-row flex-col gap-2"
        @submit.prevent="handleSubmission"
      >
        <label
          class="flex md:flex-row flex-col gap-4 flex-grow md:items-center"
        >
          What should I build next?
          <input
            name="idea"
            autofocus
            :disabled="ideaStatus === 'submitting'"
            type="text"
            class="bg-gray-600 text-white text-sm px-2 py-1 flex-grow disabled:opacity-50 disabled:pointer-events-none"
          />
        </label>
        <button
          type="submit"
          class="px-2 py-1 font-semibold tracking-[0.15rem] text-sm uppercase"
          :class="{
            'bg-green-900': ideaStatus === 'submitted',
            'bg-red-900': ideaStatus === 'error',
          }"
        >
          {{
            ideaStatus === 'submitted'
              ? 'Done'
              : ideaStatus === 'error'
              ? 'Error'
              : 'Submit'
          }}
        </button>
      </form>
      <TheClientWork />
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Work' })

const ideaStatus = ref<'ready' | 'submitting' | 'submitted' | 'error'>('ready')
async function handleSubmission(e: Event) {
  const data = new FormData(e.target as HTMLFormElement)
  ideaStatus.value = 'submitting'
  try {
    await $fetch('/api/idea', {
      method: 'POST',
      body: Object.fromEntries([...data.entries()]),
    })
    ideaStatus.value = 'submitted'
  } catch {
    ideaStatus.value = 'error'
  }
}
</script>
