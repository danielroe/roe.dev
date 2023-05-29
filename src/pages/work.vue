<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[70ch]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Work</h1>
    </header>

    <main class="text-lg">
      <GithubRepos />
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
      <section
        :class="$style.logos"
        class="flex flex-row flex-wrap justify-center items-center my-12 gap-8"
      >
        <nuxt-picture
          v-for="([image, dimensions], name) in clients"
          :key="name"
          :alt="name"
          :src="`/img/work/${image}`"
          v-bind="dimensions"
        />
      </section>
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

const clients = {
  Comcast: ['comcast.svg', { height: 32, width: 80 }],
  'Durham University': ['durham-university.svg', { height: 32, width: 80 }],
  'Parent Scheme': ['parentscheme.svg', { height: 32, width: 80 }],
  Concision: ['concision.svg', { height: 32, width: 80 }],
  'North East Local Enterprise Partnership': [
    'nelep.png',
    { height: 32, width: 86 },
  ],
  Convoke: ['convoke.png', { height: 32, width: 181 }],
  'Acadian Software': ['acadian-software.svg', { height: 32, width: 80 }],
  NuxtLabs: ['nuxtlabs.svg', { height: 32, width: 80 }],
  Canvas8: ['canvas8.svg', { height: 32, width: 80 }],
  'Imperial Enterprise Lab': [
    'imperial-enterprise-lab.svg',
    { height: 32, width: 80 },
  ],
}
</script>

<style module>
.logos > * {
  @apply h-full w-auto flex-grow-0 flex-shrink max-h-8 max-w-[5rem];
}

:global(.light-mode) .logos img {
  filter: invert(1) opacity(0.8);
}
</style>
