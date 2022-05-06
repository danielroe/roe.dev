<template>
  <ItemList>
    <NuxtLink
      v-for="{ title, slug, date, formattedDate } in entries.slice(0, limit)"
      :key="slug"
      :to="slug.replace('articles', 'blog')"
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

<script lang="ts" setup>
interface Entry {
  title: string
  date: string
  slug: string
  formattedDate: string
}

defineProps({
  limit: {
    type: Number as () => number,
    default: Infinity,
  },
})

const { data: entries } = await useAsyncData(
  'blog',
  () =>
    queryContent('/articles')
      .only(['title', 'date', 'slug'])
      .find()
      .then(async r =>
        process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
      ),
  {
    transform: (entries: any[]) => {
      entries = entries.map(formatDateField)
      entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      return (entries as Entry[]) || []
    },
  }
)
</script>
