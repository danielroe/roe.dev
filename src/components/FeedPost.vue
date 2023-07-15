<script setup lang="ts">
defineProps({
  html: String,
  datetime: [Date, String, Number],
  permalink: String,
  media: Array as () => Array<{
    url?: string | null
    width?: number
    height?: number
    alt?: string | null
  }>,
})
</script>

<template>
  <article
    class="p-4 relative text-base flex flex-row gap-4 shadow min-h-12 transition-all border-[1px] border-solid border-transparent after:text-transparent flex-[100%] bg-[var(--accent)]"
  >
    <nuxt-img
      src="/me.jpg"
      class="rounded-full self-start"
      height="48"
      width="48"
    />
    <div class="flex flex-col gap-4 w-full">
      <header class="flex flex-row justify-between items-center text-sm w-full">
        <div>
          <slot name="account" />
        </div>
        <a :href="permalink">
          <NuxtTime
            v-if="datetime"
            class="font-bold text-xs uppercase"
            :datetime="datetime"
            weekday="long"
            day="numeric"
            month="long"
            year="numeric"
          />
        </a>
      </header>
      <div v-html="html" />
      <nuxt-img
        v-if="media?.length && media[0].url"
        :src="media[0].url"
        :width="media[0].width"
        :height="media[0].height"
        :alt="media[0].alt"
      />
    </div>
  </article>
</template>

<style scoped>
div :global(.invisible) {
  display: none;
}

div :global(.ellipsis::after) {
  content: '...';
  display: inline-block;
}
</style>
