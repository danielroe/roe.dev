<template>
  <div class="flex flex-col gap-2">
    <article v-for="item in data" :key="item.permalink">
      <FeedPost
        :html="item.html"
        :datetime="item.createdAt"
        :permalink="item.permalink"
        :media="item.media"
      >
        <template #account>
          <a href="https://elk.zone/mastodon.roe.dev/@daniel">
            <span class="i-ri:mastodon-fill h-4 w-4" />
            daniel@roe.dev
          </a>
        </template>
      </FeedPost>
    </article>
  </div>
</template>

<script lang="ts" setup>
const { data } = await useFetch('/_social/mastodon', {
  default: () => [],
})
</script>
