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
          class="absolute flex top-0 right-0 pr-1 text-primary before:content-empty before:relative before:block before:w-full before:-mt-4 before:mb-2 before:bg-background before:rotate-30 before:scale-x-1000"
        >
          <span class="z-10 h-8 w-8 i-ri:github-fill" alt="" />
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
  const formatter = new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    compactDisplay: 'short',
  })
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
          stars: formatter.format(1400),
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
        stars: formatter.format(stars),
        language,
      }
    })
  )
})
</script>
