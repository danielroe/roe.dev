<script lang="ts" setup>
const links = [
  {
    name: 'GitHub',
    link: 'https://github.com/danielroe/',
  },
  {
    name: 'LinkedIn',
    link: 'https://www.linkedin.com/in/daniel-roe/',
  },
  {
    name: 'Twitter',
    link: 'https://twitter.com/danielcroe',
  },
  {
    link: 'https://mastodon.roe.dev/@daniel',
    name: 'Mastodon',
  },
  {
    link: '/feed.xml',
    name: 'RSS',
  },
]

const year = new Date().getFullYear()
</script>

<template>
  <div>
    <footer
      class="before:block before:mx-auto before:my-4 before:content before:w-4 before:border-t-2 before:border-solid before:border-gray-700 relative text-center mx-auto px-4 py-2 max-w-[50rem]"
    >
      <small>&copy; 2019-{{ year }} Daniel Roe. All rights reserved.</small>
      <ul class="flex flex-row justify-center gap-4 my-4 items-center">
        <li
          v-for="{ link, name } in links"
          :key="name"
          class="inline-flex items-center"
        >
          <a :href="link" rel="me">
            <svg class="h-4 w-4 fill-current" alt="">
              <use :xlink:href="`#${name.toLowerCase()}`" />
            </svg>
            <span class="visually-hidden">
              {{ name }}
            </span>
          </a>
        </li>
      </ul>
    </footer>
  </div>
</template>
