<script lang="ts" setup>
const links = [
  {
    icon: resolveComponent('IconsGithub'),
    name: 'GitHub',
    link: 'https://github.com/danielroe/',
  },
  {
    icon: resolveComponent('IconsLinkedin'),
    name: 'LinkedIn',
    link: 'https://www.linkedin.com/in/daniel-roe/',
  },
  {
    icon: resolveComponent('IconsTwitter'),
    name: 'Twitter',
    link: 'https://twitter.com/danielcroe',
  },
]
</script>

<template>
  <footer
    v-once
    class="relative before:block before:mx-auto before:my-4 before:content before:w-4 before:border-t-2 before:border-solid before:border-gray-700"
  >
    <small>&copy; 2019-2022 Daniel Roe. All rights reserved.</small>
    <ul class="flex flex-row justify-center gap-4 my-4 items-center">
      <li
        v-for="{ link, name, icon } in links"
        :key="name"
        class="inline-flex items-center"
      >
        <a :href="link">
          <component :is="icon" alt="" class="w-4 h-4 fill-current" />
          <span class="visually-hidden">
            {{ name }}
          </span>
        </a>
      </li>
    </ul>
  </footer>
</template>
