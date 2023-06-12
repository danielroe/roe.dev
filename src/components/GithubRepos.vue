<template>
  <section class="flex flex-row flex-wrap gap-4">
    <GridLink
      v-for="{ repo, stars, language } in repos"
      :key="repo"
      class="overflow-hidden md:min-h-[8rem] md:flex-[40%]"
      :href="`https://github.com/${repo}`"
      :aria-label="`GitHub repository for ${repo}`"
    >
      <article>
        <span
          :class="$style.badge"
          class="absolute flex top-0 right-0 p-1 before:absolute before:block before:w-full before:-mt-4"
        >
          <svg class="z-10 h-4 w-4 fill-current" alt="">
            <use xlink:href="#github" />
          </svg>
        </span>
        <header>
          {{ repo }}
          <dl
            class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
          >
            <template v-if="stars">
              <dt class="float-left md:float-none mr-2">Stars</dt>
              <dd class="font-semibold mr-4">
                {{ stars }}
              </dd>
            </template>
            <template v-if="language">
              <dt class="float-left md:float-none mr-2">Language</dt>
              <dd class="font-semibold mr-4">
                {{ language }}
              </dd>
            </template>
          </dl>
        </header>
      </article>
    </GridLink>
  </section>
</template>

<script lang="ts" setup>
const config = useRuntimeConfig()
const { data: repos } = await useAsyncData('repos', () => {
  if (process.client && !process.dev) return Promise.resolve([])
  const repos = [
    'nuxt/nuxt',
    // 'nuxt/vercel-builder',
    'danielroe/magic-regexp',
    'danielroe/fontaine',
    'danielroe/nuxt-vitest',
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
      // @ts-expect-error No typings for GH API
      const { stargazers_count: stars, language } = await $fetch(
        `https://api.github.com/repos/${repo}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${config.github.token}`,
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
