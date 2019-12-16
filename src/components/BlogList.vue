<template>
  <aside :class="$style.list">
    <router-link
      v-for="{ title, slug, date } in entries"
      :key="slug"
      :to="`/blog/${slug}`"
      :title="title"
    >
      <article>
        <header>
          {{ title }}
          <dl v-if="date">
            <dt>Published</dt>
            <dd>
              <time :datetime="date">{{ formatDate(date) }}</time>
            </dd>
          </dl>
        </header>
      </article>
    </router-link>
  </aside>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'
import { useBlogEntries } from '@/utils/blogs'

export default createComponent({
  props: {
    limit: {
      type: Number as () => number,
      default: 0,
    },
  },
  setup(props) {
    const { entries } = useBlogEntries()
    function formatDate(date: string) {
      const d = new Date(date)
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    }
    return {
      entries: props.limit ? entries.slice(0, props.limit) : entries,
      formatDate,
    }
  },
})
</script>

<style lang="postcss" module>
.list {
  @apply flex flex-row flex-wrap -mx-2;
  > * {
    @apply p-4 m-2;
    @apply text-xl flex flex-col justify-end;
    @apply shadow;
    background-color: var(--accent, theme('colors.gray.900'));
    min-height: 10rem;
    flex: 40%;
    @media (width < 767px) {
      flex: 100%;
      min-height: 3rem;
    }
  }
  a {
    transition: 0.3s transform;
    border: 1px solid transparent;
    transition: 0.3s border-color;

    &:hover,
    &:active,
    &:focus {
      @apply outline-none;
      border-color: var(--text, theme('colors.muted'));
    }
  }
  a::after {
    @apply text-transparent;
  }
}
</style>
