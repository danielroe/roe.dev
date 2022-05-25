<template>
  <ItemList>
    <NuxtLink
      v-for="{ title, path, date, formattedDate } in entries.slice(0, limit)"
      :key="path"
      :to="path"
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
defineProps({
  limit: {
    type: Number as () => number,
    default: Infinity,
  },
})

const { data: entries } = await useAsyncData(
  'blog',
  () =>
    queryContent('/blog')
      .only(['title', 'date', '_path'])
      .find()
      .then(async r =>
        process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
      ),
  {
    transform: (
      result: Array<{ title: string; date: string; _path: string }>
    ) => {
      return result
        .map(e => ({
          ...formatDateField(e),
          path: e._path,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
  }
)
</script>
