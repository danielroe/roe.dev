<template>
  <div class="flex flex-col justify-start gap-2">
    <article v-for="(item, index) in sortedFeed" :key="item.permalink">
      <hr
        v-if="index !== 0"
        class="block mx-auto my-2 content w-4 border-t-2 border-solid border-gray-700"
      />
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
const sortedFeed = [...mastodon, ...bluesky]
  .sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  .filter(p => !p.html.includes('twitch.tv/danielroe'))
</script>

<style scoped>
div :global(.invisible) {
  display: none;
}

div :global(.ellipsis::after) {
  display: inline-block;
  content: '...';
}
</style>
