<template>
  <ItemList>
    <NuxtLink
      v-for="{ title, slug, date, formattedDate } in entries.slice(0, limit)"
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
              <time :datetime="date">{{ formattedDate }}</time>
            </dd>
          </dl>
        </header>
      </article>
    </NuxtLink>
  </ItemList>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

import ItemList from '~/components/ItemList.vue'

interface Entry {
  title: string
  date: string
  slug: string
  formattedDate: string
}

export default defineComponent({
  components: { ItemList },
  props: {
    limit: {
      type: Number as () => number,
    },
  },
  async fetch() {
    const entries: Entry[] = (
      await this.$content('articles').only(['title', 'date', 'slug']).fetch()
    ).map((entry: Entry) => {
      const d = new Date(entry.date)
      const formattedDate = `${d.getFullYear()}-${
        d.getMonth() + 1
      }-${d.getDate()}`
      return { ...entry, formattedDate }
    })

    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    this.entries = entries
  },
  data: () => ({
    entries: [] as Entry[],
  }),
})
</script>
