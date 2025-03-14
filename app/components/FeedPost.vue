<script setup lang="ts">
defineProps({
  avatar: String,
  html: String,
  handle: String,
  accountLink: String,
  network: String as () => 'bluesky' | 'mastodon',
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
    class="p-4 relative text-base flex flex-row gap-4 shadow min-h-12 transition-all border-[1px] border-solid border-transparent after:text-transparent flex-[100%]"
  >
    <NuxtImg
      :src="avatar ?? '/me.jpg'"
      class="rounded-full self-start w-12 h-12"
      height="48"
      width="48"
      alt="Avatar for Daniel Roe"
    />
    <div class="flex flex-col gap-4 w-full">
      <header class="flex flex-row items-center text-sm w-full gap-2">
        <a :href="accountLink">
          <div class="flex flex-row gap-2 items-center">
            <span
              class="flex-shrink-0 h-4 w-4"
              :class="
                network === 'mastodon'
                  ? 'i-ri:mastodon-fill'
                  : 'i-tabler-brand-bluesky'
              "
            />
            <span
              class="avatar w-full flex flex-row items-center gap-2 max-h-4"
              v-html="handle"
            />
          </div>
        </a>
        <a
          class="ml-auto"
          :href="permalink"
        >
          <NuxtTime
            v-if="datetime"
            class="text-xs uppercase"
            :datetime="datetime"
            day="numeric"
            month="long"
            year="numeric"
          />
        </a>
      </header>
      <div
        class="html"
        v-html="html"
      />
      <NuxtImg
        v-if="media?.length && media[0] && media[0].url && !media[0].url.endsWith('.mp4')"
        :src="media[0].url"
        :width="media[0].width"
        :height="media[0].height"
        :alt="media[0].alt || undefined"
      />
      <video
        v-else-if="media?.[0] && media[0].url?.endsWith('.mp4')"
        loop
        playsinline
        controls
        :alt="media[0].alt || undefined"
        :width="media[0].width"
        :height="media[0].height"
      >
        <source
          :src="media[0].url"
          type="video/mp4"
        >
      </video>
    </div>
  </article>
</template>

<style>
.html a {
  @apply underlined-link;
}
</style>
