<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">
        some of what I use
      </h1>
    </header>
    <main
      class="text-muted text-lg max-w-[37.50rem] text-base"
      :class="$style.uses"
    >
      <StaticMarkdownRender
        collection="page"
        path="/uses"
      />
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Uses' })
</script>

<style module>
.uses {
  h2,
  h3 {
    @apply text-lg;
  }

  h2:not(:first-child),
  h3 {
    @apply mt-6;
  }

  ul {
    @apply mt-4 pl-4;

    list-style-type: '✦ ';

    ul {
      list-style-type: '‣ ';
    }
  }
}
</style>
