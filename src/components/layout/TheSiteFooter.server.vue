<script lang="ts" setup>
const links = [
  {
    name: 'GitHub',
    icon: 'i-ri:github-fill',
    link: 'https://github.com/danielroe/',
  },
  {
    name: 'LinkedIn',
    icon: 'i-ri:linkedin-fill',
    link: 'https://www.linkedin.com/in/daniel-roe/',
  },
  {
    name: 'Twitter',
    icon: 'i-ri:twitter-fill',
    link: 'https://twitter.com/danielcroe',
  },
  {
    name: 'Mastodon',
    icon: 'i-ri:mastodon-fill',
    link: 'https://mastodon.roe.dev/@daniel',
  },
  {
    name: 'Bluesky',
    icon: 'i-ri:checkbox-blank-fill',
    link: 'https://bsky.app/profile/danielroe.dev',
  },
  {
    name: 'RSS',
    icon: 'i-ri:rss-fill',
    link: '/rss.xml',
  },
]

const year = new Date().getFullYear()
</script>

<template>
  <div>
    <footer
      class="before:content-empty before:block before:mx-auto before:my-4 before:content before:w-4 before:border-t-2 before:border-solid before:border-gray-700 relative text-center mx-auto px-4 py-2 max-w-[50rem]"
    >
      <small>&copy; 2019-{{ year }} Daniel Roe. All rights reserved.</small>
      <ul class="flex flex-row justify-center gap-4 my-4 items-center">
        <li
          v-for="{ link, name, icon } in links"
          :key="name"
          class="inline-flex items-center"
        >
          <a :href="link" rel="me">
            <span class="h-4 w-4 fill-current" :class="icon" alt="" />
            <span class="visually-hidden">
              {{ name }}
            </span>
          </a>
        </li>
      </ul>
    </footer>
  </div>
</template>
