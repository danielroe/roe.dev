<template>
  <article v-if="title" :class="$style.blog">
    <header>
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
    <main>
      <component :is="component" />
    </main>
    <footer></footer>
  </article>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'
import { VueConstructor } from 'vue'
import { Route } from 'vue-router'

import { getMatchOrReturn } from '../../utils/global'

export default createComponent({
  head(this: { title: string; description: string; $route: Route }) {
    const slug = getMatchOrReturn(this.$route.fullPath, /\/([^/]*)\/?$/, 1)
    return {
      title: this.title,
      meta: [
        {
          name: 'description',
          content: this.description,
          vmid: 'description',
        },
        { property: 'og:image', content: `/og/${slug}.jpg` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:title', content: this.title },
        { property: 'og:description', content: this.description },
      ],
    }
  },
  setup(props, { root }) {
    const slug = root.$route.params.article
    if (!slug) root.$router.push('/blog')

    try {
      const {
        attributes: { title, date, tags, description },
        vue: { component },
      } = require(`@/content/articles/${slug}.md`)

      const d = new Date(date)

      return {
        component,
        title,
        tags: tags || [],
        date: date || '',
        description,
        formattedDate: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      }
    } catch (e) {
      root.$router.push('/blog')
      return {
        title: '',
        description: '',
      }
    }
  },
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
  p ~ div {
    @apply mt-4 py-1 uppercase text-xs font-bold text-gray-600;
    letter-spacing: 0.15rem;
    background-color: theme('colors.gray.900');
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw;
  }
  pre {
    @apply font-code text-sm;
    background-color: theme('colors.gray.900') !important;
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw;
    @media (width < 767px) {
      white-space: pre-wrap;
    }

    + * {
      @apply mt-4;
    }
    + h3,
    + h4 {
      @apply mt-8;
    }
  }
  blockquote {
    @apply pl-4 border-l-4;
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
}
</style>
