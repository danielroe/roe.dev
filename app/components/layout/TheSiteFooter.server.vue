<script lang="ts" setup>
const links = [
  {
    name: 'GitHub',
    icon: 'i-ri:github-fill',
    link: 'https://github.com/danielroe/',
  },
  {
    name: 'Bluesky',
    icon: 'i-tabler-brand-bluesky',
    link: 'https://bsky.app/profile/danielroe.dev',
  },
  {
    name: 'LinkedIn',
    icon: 'i-ri:linkedin-fill',
    link: 'https://www.linkedin.com/in/daniel-roe/',
  },
  {
    name: 'Mastodon',
    icon: 'i-ri:mastodon-fill',
    link: 'https://mastodon.roe.dev/@daniel',
  },
  {
    name: 'Instagram',
    icon: 'i-ri:instagram-fill',
    link: 'https://www.instagram.com/daniel.c.roe',
  },
  {
    name: 'Twitch',
    icon: 'i-ri-twitch-fill',
    link: 'https://twitch.tv/danielroe',
  },
  {
    name: 'YouTube',
    icon: 'i-ri-youtube-fill',
    link: 'https://www.youtube.com/@danielroe',
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
      <small>
        &copy; 2019-{{ year }} Daniel Roe.
        <a
          class="underlined-link"
          href="https://creativecommons.org/licenses/by-sa/4.0/"
        >
          CC BY-SA 4.0
        </a>
      </small>
      <ul class="flex flex-row justify-center gap-4 my-4 items-center">
        <li
          v-for="{ link, name, icon } in links"
          :key="name"
          class="inline-flex items-center"
        >
          <a
            :href="link"
            rel="me"
          >
            <span
              class="h-4 w-4 fill-current"
              :class="icon"
              alt=""
            />
            <span class="sr-only">
              {{ name }}
            </span>
          </a>
        </li>
      </ul>
    </footer>
  </div>
</template>
