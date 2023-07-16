<template>
  <div class="flex flex-col gap-2">
    <article v-for="item in sortedFeed" :key="item.permalink">
      <FeedPost
        :html="item.html"
        :handle="item.handle"
        :network="item.network"
        :account-link="item.accountLink"
        :datetime="item.createdAt"
        :permalink="item.permalink"
        :media="item.media"
        :avatar="item.avatar"
      />
    </article>
  </div>
</template>

<script lang="ts" setup>
const [mastodon, bluesky] = await Promise.all([
  $fetch('/_social/mastodon'),
  $fetch('/_social/bluesky'),
])
const sortedFeed = [...mastodon, ...bluesky].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
)
</script>

<style scoped>
div :global(.invisible) {
  display: none;
}

div :global(.ellipsis::after) {
  display: inline-block;
}
</style>
