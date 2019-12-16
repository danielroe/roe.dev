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

export default createComponent({
  head(this: { title: string }) {
    return {
      title: this.title,
    }
  },
  setup(props, { root }) {
    const slug = root.$route.params.article
    if (!slug) root.$router.push('/blog')

    try {
      const {
        attributes: { title, date, tags },
        vue: { component },
      } = require(`./${slug}.md`)

      const d = new Date(date)

      return {
        component,
        title,
        tags: tags || [],
        date: date || '',
        formattedDate: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      }
    } catch (e) {
      root.$router.push('/blog')
      return {
        title: '',
      }
    }
  },
})
</script>

<style lang="postcss" module>
.blog {
  h3 {
    @apply text-xl mt-8;
  }

  h4 {
    @apply uppercase text-sm mt-8;
    letter-spacing: 0.1rem;
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
  pre {
    @apply font-code text-sm;
    background-color: theme('colors.gray.900') !important;
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw;
    @media (width < 767px) {
      white-space: pre-wrap;
    }
  }
  ol,
  ul {
    @apply pl-6;

    li {
      counter-increment: list;
      @apply my-4;
      &::before {
        @apply -ml-6 mr-2 inline-block font-semibold leading-none;
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
