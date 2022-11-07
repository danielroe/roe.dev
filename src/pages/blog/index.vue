<template>
  <div>
    <header><h2 class="text-2xl">Articles</h2></header>
    <main>
      <section class="flex flex-row flex-wrap -mx-2">
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
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Blog' })
const { data: entries } = await useAsyncData(
  () =>
    ((process.server || process.dev) as true) &&
    queryContent('/blog').only(['title', 'date', '_path']).find(),
  {
    transform: result => {
      return (result as Array<{ title?: string; date: string; _path: string }>)
        .map(e => ({
          ...formatDateField(e),
          path: e._path,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
  }
)
</script>
