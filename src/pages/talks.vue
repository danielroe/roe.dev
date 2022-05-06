<template>
  <div>
    <header>
      <h2>Talks</h2>
    </header>
    <main>
      <ItemList>
        <a
          v-for="{ title, source, link, date, formattedDate } in talks"
          :key="link"
          :alt="title"
          :href="link"
          rel="noopener"
        >
          <article>
            <header>
              {{ title }}
              <dl v-if="date">
                <dt>Date</dt>
                <dd>
                  <time :datetime="date">{{ formattedDate }}</time>
                </dd>
                <dt v-if="source">Where</dt>
                <dd v-if="source">
                  {{ source }}
                </dd>
              </dl>
            </header>
          </article>
        </a>
      </ItemList>
    </main>
  </div>
</template>

<script lang="ts" setup>
interface Talk {
  title: string
  name: string
  type: string
  source: string
  tags: string
  link: string
  date: string
  formattedDate: string
}

useHead({
  title: 'Talks',
})
const { data: talks } = await useAsyncData(
  'talks',
  () =>
    queryContent('/talks')
      .only(['title', 'source', 'link', 'date', 'formattedDate'])
      .find()
      .then(async r =>
        process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
      ) as unknown as Promise<Talk[]>,
  {
    transform: talks => {
      talks?.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      return (talks?.map(formatDateField) as Talk[]) || []
    },
  }
)
</script>
