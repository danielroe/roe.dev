<template>
  <div :class="$style.work">
    <header>
      <h2>Work</h2>
    </header>

    <main>
      <GithubRepos />
      <section :class="$style.logos">
        <nuxt-img
          v-for="(image, name) in clients"
          :key="name"
          :alt="name"
          :src="image"
        />
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
const clients = {
  Comcast: '/img/work/comcast.svg',
  'Durham University': '/img/work/durham-university.svg',
  'Parent Scheme': '/img/work/parentscheme.svg',
  Concision: '/img/work/concision.svg',
  'North East Local Enterprise Partnership': '/img/work/nelep.png',
  Convoke: '/img/work/convoke.png',
  'Acadian Software': '/img/work/acadian-software.svg',
  NuxtLabs: '/img/work/nuxtlabs.svg',
  Canvas8: '/img/work/canvas8.svg',
  'Imperial Enterprise Lab': '/img/work/imperial-enterprise-lab.svg',
}

useHead({
  title: 'Work',
})
</script>

<style module>
.logos {
  @apply flex flex-row flex-wrap justify-center items-center my-12;

  > * {
    @apply mx-4 my-4;
    @apply h-full w-auto flex-grow-0 flex-shrink;

    flex-basis: 3rem;
    max-height: 2rem;
    max-width: 5rem;
  }

  @media (width < 767px) {
    > * {
      flex-basis: 33%;
    }
  }
}

:global(.light-mode) .work img {
  filter: invert(1) opacity(0.8);
}
</style>
