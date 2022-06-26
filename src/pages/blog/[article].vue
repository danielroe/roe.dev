<template>
  <article :class="$style.blog">
    <header v-if="page">
      <h2>{{ page.title }}</h2>
      <dl v-if="page.date && formattedDate">
        <dt>Published</dt>
        <dd>
          <time :datetime="page.date">{{ formattedDate }}</time>
        </dd>
        <template v-if="page.tags && page.tags.length">
          <dt>Tags</dt>
          <dd>
            <span v-for="tag in page.tags" :key="tag" v-text="tag" />
          </dd>
        </template>
      </dl>
    </header>
    <section v-if="page">
      <StaticMarkdownRender :cache-key="page.title" :value="page" />
    </section>
  </article>
</template>

<script lang="ts" setup>
const route = useRoute()
const slug = route.params.article
if (!slug) navigateTo('/blog')

const { data: page } = await useAsyncData(route.path, () =>
  queryContent(route.path)
    .only(['title', 'type', 'body', 'date', 'tags'])
    .findOne()
    .then(async r =>
      process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
    )
)
const d = new Date(page.value.date)
const formattedDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

const ogSlug = getMatchOrReturn(route.fullPath, /\/([^/]*)\/?$/, 1)
useHead({
  title: page.value.title,
  meta: [
    {
      name: 'description',
      content: page.value.description,
      hid: 'description',
    },
    {
      hid: 'og:image',
      property: 'og:image',
      content: `https://roe.dev/og/${ogSlug}.jpg`,
    },
    { hid: 'og:title', property: 'og:title', content: page.value.title },
    {
      hid: 'og:description',
      property: 'og:description',
      content: page.value.description,
    },
  ],
})
</script>

<style module>
.blog {
  h3 {
    @apply text-xl mb-4;
  }

  h4 {
    @apply uppercase text-sm;

    letter-spacing: 0.1rem;
  }

  * + h3,
  * + h4 {
    @apply mt-8;
  }

  div + div {
    @apply mb-6;
  }

  pre {
    @apply font-code text-sm my-0;

    background-color: theme('colors.gray.900') !important;
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw !important;
    @media (width < 767px) {
      white-space: pre-wrap;
    }

    + h3,
    + h4 {
      @apply mt-8;
    }
  }

  ol,
  ul {
    @apply pl-6;

    li {
      @apply my-4;

      counter-increment: list;

      &::before {
        @apply -ml-6 mt-2 mr-2 inline-block font-semibold leading-none;

        width: 1rem;
      }

      > :first-child {
        @apply inline-block;
      }
    }
  }

  ul li::before {
    content: '›';
  }

  ol li::before {
    @apply text-xs;

    content: counter(list);
  }

  p {
    + pre,
    + p {
      @apply mt-4;
    }

    + ul,
    + ol {
      @apply my-2;
    }

    + table {
      @apply my-4;
    }
  }

  p > code,
  li > code {
    @apply px-2 py-1 mx-1 text-sm;

    color: var(--background, theme('colors.gray.800'));
    background-color: var(--text-base, theme('colors.white'));
  }

  p + div {
    @apply mt-6 py-1 uppercase text-xs font-bold text-gray-600;

    letter-spacing: 0.15rem;
    background-color: theme('colors.gray.900');
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw;
  }

  blockquote {
    @apply pl-4 border-l-4;
  }
}
</style>
