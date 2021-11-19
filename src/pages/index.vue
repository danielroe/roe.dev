<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <NuxtContent :document="page" />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  data: () => ({ page: null as any }),
  async fetch() {
    this.page = await this.$content(`index`).fetch()
  },
  head: {
    title: 'Daniel Roe',
    meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
  },
})
</script>

<style lang="postcss" module>
.home {
  p + p {
    @apply mt-4;
  }

  h3 {
    @apply mt-12;
  }
}
</style>
