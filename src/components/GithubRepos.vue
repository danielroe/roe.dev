<template>
  <ItemList>
    <a
      v-for="{ repo, stars, language } in repos"
      :key="repo"
      class="overflow-hidden"
      :href="`https://github.com/${repo}`"
      :aria-label="`GitHub repository for ${repo}`"
    >
      <article>
        <span
          :class="$style.badge"
          class="absolute flex top-0 right-0 p-1 before:absolute before:block before:w-full before:-mt-4"
        >
          <IconsGithub class="z-10 h-4 w-4 fill-current" />
        </span>
        <header>
          {{ repo }}
          <dl>
            <template v-if="stars">
              <dt>Stars</dt>
              <dd>
                {{ stars }}
              </dd>
            </template>
            <template v-if="language">
              <dt>Language</dt>
              <dd>
                {{ language }}
              </dd>
            </template>
          </dl>
        </header>
      </article>
    </a>
  </ItemList>
</template>

<script lang="ts" setup>
useHead({
  link: [
    {
      rel: 'preconnect',
      href: '//api.github.com',
      crossorigin: 'use-credentials',
    },
  ],
})
const config = useRuntimeConfig()
const { data: repos } = await useAsyncData('repos', () => {
  if (process.client && !process.dev) return
  const repos = [
    'nuxt/framework',
    'nuxt/nuxt.js',
    // 'nuxt/vercel-builder',
    'danielroe/magic-regexp',
    'danielroe/typed-vuex',
    // 'nuxt-community/composition-api',
    // 'nuxt-community/sanity-module',
    // 'danielroe/sanity-typed-queries',
  ]
  return Promise.all(
    repos.map(async repo => {
      if (process.dev) {
        return {
          repo,
          stars: 100,
          language: 'TypeScript',
        }
      }
      const { stargazers_count: stars, language } = await $fetch(
        `https://api.github.com/repos/${repo}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${config.githubToken}`,
          },
        }
      )
      return {
        repo,
        stars,
        language,
      }
    })
  )
})
</script>

<style module>
.badge {
  color: var(--text-base, theme('colors.gray.300'));

  &::before {
    height: calc(100% + 1rem);
    content: '';
    background-color: var(--background, theme('colors.white'));
    transform: rotate(30deg) scaleX(10);
  }
}
</style>
