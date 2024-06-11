<script setup lang="ts">
const clients = {
  'Comcast': ['comcast.svg', { height: 32, width: 80 }],
  'Durham University': ['durham-university.svg', { height: 32, width: 80 }],
  'Parent Scheme': ['parentscheme.svg', { height: 32, width: 80 }],
  'Concision': ['concision.svg', { height: 32, width: 80 }],
  'North East Local Enterprise Partnership': [
    'nelep.png',
    { height: 32, width: 86 },
  ],
  'Convoke': ['convoke.png', { height: 32, width: 181 }],
  'Acadian Software': ['acadian-software.svg', { height: 32, width: 80 }],
  'NuxtLabs': ['nuxtlabs.svg', { height: 32, width: 80 }],
  'Canvas8': ['canvas8.svg', { height: 32, width: 80 }],
  'Imperial Enterprise Lab': [
    'imperial-enterprise-lab.svg',
    { height: 32, width: 80 },
  ],
} as const
</script>

<template>
  <section
    class="flex flex-row flex-wrap justify-center items-center my-12 gap-8 *:h-full *:w-auto *:flex-grow-0 *:flex-shrink *:max-h-8 *:max-w-[5rem]"
  >
    <nuxt-picture
      v-for="([image, dimensions], name) in clients"
      :key="name"
      :alt="name"
      class="light:*:invert-100 light:*:opacity-80"
      :src="`/img/work/${image}`"
      v-bind="dimensions"
    />
  </section>
</template>
