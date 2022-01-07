<template>
  <div :class="$style.work">
    <header>
      <h2>Work</h2>
    </header>

    <main>
      <GithubRepos />
      <section :class="$style.logos">
        <img
          v-for="(image, name) in clients"
          :key="name"
          :alt="name"
          :src="image"
        />
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

const clients = {
  Comcast: require('~/assets/images/work/comcast.svg'),
  'Durham University': require('~/assets/images/work/durham-university.svg'),
  'Parent Scheme': require('~/assets/images/work/parentscheme.svg'),
  Concision: require('~/assets/images/work/concision.svg'),
  'North East Local Enterprise Partnership': require('~/assets/images/work/nelep.png'),
  Convoke: require('~/assets/images/work/convoke.png'),
  'Acadian Software': require('~/assets/images/work/acadian-software.svg'),
  NuxtLabs: require('~/assets/images/work/nuxtlabs.svg'),
  Canvas8: require('~/assets/images/work/canvas8.svg'),
  'Imperial Enterprise Lab': require('~/assets/images/work/imperial-enterprise-lab.svg'),
}

export default defineComponent({
  setup() {
    return {
      clients,
    }
  },
  head: {
    title: 'Work',
  },
})
</script>

<style lang="postcss" module>
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
