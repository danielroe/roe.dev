<script setup lang="ts">
const entries = await queryContent('/blog')
  .only(['title', 'date', '_path'])
  .find()
  .then(result => {
    return (result as Array<{ title?: string; date: string; _path: string }>)
      .map(e => ({
        ...formatDateField(e),
        path: e._path,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })
</script>

<template>
  <section class="flex flex-row flex-wrap gap-4">
    <GridLink
      v-for="{ title, path, date, formattedDate } in entries"
      :key="path"
      :to="path"
      :title="title"
    >
      <article>
        <header>
          {{ title }}
          <dl
            v-if="date"
            class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
          >
            <dt class="float-left md:float-none mr-2">Published</dt>
            <dd class="font-semibold mr-4">
              <time :datetime="date">{{ formattedDate }}</time>
            </dd>
          </dl>
        </header>
      </article>
    </GridLink>
  </section>
</template>
