<template>
  <ItemList :class="$style.list">
    <a
      v-for="{ repo, stars, language } in repos"
      :key="repo"
      :href="`https://github.com/${repo}`"
      :aria-label="`GitHub repository for ${repo}`"
    >
      <article>
        <GithubIcon />
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
import { defineComponent } from '@vue/composition-api'

import GithubIcon from '@/components/icons/GithubCircle.vue'
import ItemList from '@/components/ItemList.vue'

import { useGithub } from '@/utils/github'

const repos = [
  'danielroe/nuxt-typed-vuex',
  'nuxt/now-builder',
  'danielroe/vue-sanity',
]

export default defineComponent({
  components: {
    GithubIcon,
    ItemList,
  },
  head() {
    return {
      link: [
        {
          rel: 'preconnect',
          href: '//api.github.com',
          crossorigin: true,
        },
      ],
    }
  },
  setup() {
    const enrichedRepos = repos.map((repo) => ({
      repo,
      ...useGithub(repo),
    }))
    return {
      repos: enrichedRepos,
    }
  },
})
</script>

<style lang="postcss" module>
.list {
  > * {
    @apply overflow-hidden;
    article > :first-child {
      @apply absolute flex top-0 right-0 p-1;
      color: var(--text, theme('colors.muted'));

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
