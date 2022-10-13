<template>
  <div :class="$style.work">
    <header>
      <h2>Work</h2>
    </header>

    <main>
      <GithubRepos />
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

useHead({
  title: 'Work',
})
</script>

<style module>
.logos > * {
  @apply h-full w-auto flex-grow-0 flex-shrink max-h-8 max-w-[5rem];
}

:global(.light-mode) .work img {
  filter: invert(1) opacity(0.8);
}
</style>
