<template>
  <footer :class="$style.footer" class="relative">
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

<script lang="ts" setup>
import GitHubIcon from '~/components/icons/github.vue'
import LinkedInIcon from '~/components/icons/linkedin.vue'
import TwitterIcon from '~/components/icons/twitter.vue'

const links = [
  {
    icon: GitHubIcon,
    name: 'GitHub',
    link: 'https://github.com/danielroe/',
  },
  {
    icon: LinkedInIcon,
    name: 'LinkedIn',
    link: 'https://www.linkedin.com/in/daniel-roe/',
  },
  {
    icon: TwitterIcon,
    name: 'Twitter',
    link: 'https://twitter.com/danielcroe',
  },
]
</script>

<style module>
.footer::before {
  @apply block mx-auto my-4;

  border-top: 2px solid theme('colors.gray.700');
  width: 1rem;
  content: '';
}
</style>
