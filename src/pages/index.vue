<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <p
        v-if="$auth.user.sponsor"
        class="mt-4 mb-4 p-4 border-[1px] border-white"
      >
        Thank you for sponsoring me. ❤️
      </p>
      <StaticMarkdownRender v-if="page" :value="page" />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
})

const { data: page } = await usePageData()
</script>

<style module>
.home {
  p + p {
    @apply mt-4;
  }
}
</style>
