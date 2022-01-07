<template>
  <ItemList :class="$style.list">
    <a
      v-for="{ repo, stars, language } in repos"
      :key="repo"
      :href="`https://github.com/${repo}`"
      :aria-label="`GitHub repository for ${repo}`"
    >
      <article>
        <span>
          <GithubIcon v-once />
        </span>
        <header>
          {{ repo }}
          <dl>
            <template v-if="stars.value">
              <dt>Stars</dt>
              <dd>
                {{ stars.value }}
              </dd>
            </template>
            <template v-if="language.value">
              <dt>Language</dt>
              <dd>
                {{ language.value }}
              </dd>
            </template>
          </dl>
        </header>
      </article>
    </a>
  </ItemList>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

import GithubIcon from '~/components/icons/github.vue'
import ItemList from '~/components/ItemList.vue'

import { useGithub } from '~/utils/github'

const repos = [
  'nuxt/framework',
  'nuxt/nuxt.js',
  'nuxt/vercel-builder',
  'nuxt-community/composition-api',
  // 'nuxt-community/sanity-module',
  // 'danielroe/typed-vuex',
  // 'danielroe/sanity-typed-queries',
]

export default defineComponent({
  components: {
    GithubIcon,
    ItemList,
  },
  setup() {
    const enrichedRepos = repos.map(repo => ({
      repo,
      ...useGithub(repo),
    }))
    return {
      repos: enrichedRepos,
    }
  },
  head() {
    return {
      link: [
        {
          hid: 'github',
          rel: 'preconnect',
          href: '//api.github.com',
          crossorigin: 'use-credentials',
        },
      ],
    }
  },
})
</script>

<style lang="postcss" module>
.list {
  > * {
    @apply overflow-hidden;

    svg {
      height: 1em;
      width: 1em;
      fill: currentColor;
    }

    article > :first-child {
      @apply absolute flex top-0 right-0 p-1;

      color: var(--text-base, theme('colors.gray.300'));

      > * {
        @apply z-10;
      }

      &::before {
        @apply absolute block w-full;

        margin-top: -1rem;
        height: calc(100% + 1rem);
        content: '';
        background-color: var(--background, theme('colors.white'));
        transform: rotate(30deg) scaleX(10);
      }
    }
  }
}
</style>
