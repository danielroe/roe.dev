<template>
  <footer :class="$style.footer">
    <small>&copy; 2019-2020 Daniel Roe. All rights reserved.</small>
    <ul>
      <li v-for="{ link, name, icon } in links" :key="name">
        <a :href="link">
          <component :is="icon" alt="" />
          <span class="visually-hidden">
            {{ name }}
          </span>
        </a>
      </li>
    </ul>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from '#imports'

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

export default defineComponent({
  setup() {
    return {
      links,
    }
  },
})
</script>

<style lang="postcss" module>
.footer {
  @apply relative;

  &::before {
    @apply block mx-auto my-4;

    border-top: 2px solid theme('colors.gray.700');
    width: 1rem;
    content: '';
  }

  ul {
    @apply flex flex-row justify-center gap-4 my-4 items-center;
  }

  li {
    @apply inline-flex items-center;
  }

  svg {
    @apply w-4 h-4 fill-current;
  }
}
</style>
