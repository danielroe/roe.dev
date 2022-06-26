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
          <IconsGithub />
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
const repos = [
  'nuxt/framework',
  'nuxt/nuxt.js',
  // 'nuxt/vercel-builder',
  'danielroe/typed-vuex',
  'nuxt-community/composition-api',
  // 'nuxt-community/sanity-module',
  // 'danielroe/sanity-typed-queries',
].map(repo => ({
  repo,
  ...useGithub(repo),
}))
</script>

<style module>
.list {
  > * {
    @apply overflow-hidden;

    svg {
      height: 1em;
      width: 1em;
      fill: currentcolor;
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
