<template>
  <div :class="$style.work">
    <header>
      <h2>Work</h2>
    </header>
    <main>
      <img
        v-for="(image, name) in clients"
        :key="name"
        :alt="name"
        :src="image"
      />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

const clients = {
  Comcast: require('~/assets/images/work/comcast.svg?inline'),
  'Durham University': require('~/assets/images/work/durham-university.svg?inline'),
  'Parent Scheme': require('~/assets/images/work/parentscheme.svg?inline'),
  Concision: require('~/assets/images/work/concision.svg?inline'),
  'North East Local Enterprise Partnership': require('~/assets/images/work/nelep.png?inline'),
  Convoke: require('~/assets/images/work/convoke.png?inline'),
  'Acadian Software': require('~/assets/images/work/acadian-software.svg?inline'),
}

export default defineComponent({
  head: {
    title: 'Work',
  },
  setup() {
    return {
      clients,
    }
  },
})
</script>

<style lang="postcss" module>
.work {
  h2 {
    @apply opacity-0;
  }
  main {
    @apply flex flex-row flex-wrap justify-center items-center;

    > * {
      @apply mx-4 my-8;
      @apply h-full w-auto flex-grow-0 flex-shrink;

      flex-basis: 5rem;
      max-height: 3rem;
      max-width: 9rem;
    }

    @media (width < 767px) {
      > * {
        flex-basis: 33%;
      }
    }
  }
}

:global(.light-mode) .work img {
  filter: invert(1) opacity(0.8);
}
</style>
