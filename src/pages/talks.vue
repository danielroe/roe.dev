<template>
  <div>
    <header>
      <h2>Talks</h2>
    </header>
    <main>
      <section class="flex flex-row flex-wrap -mx-2">
        <GridLink
          v-for="{ title, source, link, date, formattedDate } in talks"
          :key="link"
          :alt="title"
          :href="link"
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
        </GridLink>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Talks',
})

interface Talk {
  title: string
  source: string
  tags: string
  link: string
  date: string
  formattedDate: string
}

const { data: talks } = await useAsyncData(
  () =>
    ((process.server || process.dev) as true) &&
    import('../data/talks.json').then(r => r.default as any as Talk[]),
  {
    transform: talks =>
      (talks
        ?.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .map(formatDateField) as Talk[]) || [],
  }
)
</script>
