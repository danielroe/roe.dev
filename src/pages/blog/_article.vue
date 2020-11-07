<template>
  <article :class="$style.blog">
    <header v-if="title">
      <h2>{{ title }}</h2>
      <dl v-if="date && formattedDate">
        <dt>Published</dt>
        <dd>
          <time :datetime="date">{{ formattedDate }}</time>
        </dd>
        <template v-if="tags && tags.length">
          <dt>Tags</dt>
          <dd>
            <span v-for="tag in tags" :key="tag" v-text="tag" />
          </dd>
        </template>
      </dl>
    </header>
    <section v-if="page">
      <nuxt-content :document="page" />
    </section>
  </article>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { Route } from 'vue-router'

import { getMatchOrReturn } from '~/utils/global'

export default defineComponent({
  head(this: { title: string; description: string; $route: Route }) {
    const slug = getMatchOrReturn(this.$route.fullPath, /\/([^/]*)\/?$/, 1)
    return {
      title: this.title,
      meta: [
        {
          name: 'description',
          content: this.description,
          hid: 'description',
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: `https://roe.dev/og/${slug}.jpg`,
        },
        { hid: 'og:title', property: 'og:title', content: this.title },
        {
          hid: 'og:description',
          property: 'og:description',
          content: this.description,
        },
      ],
    }
  },
  async fetch() {
    const slug = this.$route.params.article
    if (!slug) this.$router.push('/blog')

    const page: Record<string, any> = await this.$content(
      `articles/${slug}`
    ).fetch()
    const d = new Date(page.date)

    this.page = page

    this.title = page.title
    this.tags = page.tags || []
    this.date = page.date || ''
    this.description = page.description
    this.formattedDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  },
  data: () => ({
    page: null as any,
    tags: [],
    date: '',
    title: '',
    description: '',
    formattedDate: '',
  }),
})
</script>

<style lang="postcss" module>
.blog {
  h3 {
    @apply text-xl;
  }

  h4 {
    @apply uppercase text-sm;

    letter-spacing: 0.1rem;
  }
  * + h3,
  * + h4 {
    @apply mt-8;
  }

  :global(.nuxt-content-highlight) {
    @apply mb-6;
  }
  p + :global(.nuxt-content-highlight) {
    @apply mt-6;
  }

  pre {
    @apply font-code text-sm my-0;

    background-color: theme('colors.gray.900') !important;
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw;
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

  p + div:not(:global(.nuxt-content-highlight)) {
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
