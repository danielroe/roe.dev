<script setup lang="ts">
const entries = await queryContent('/blog')
  .only(['title', 'date', '_path'])
  .find()
  .then(result => {
    return (result as Array<{ title?: string; date: string; _path: string }>)
      .map(e => ({
        ...e,
        path: e._path,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })
</script>

<template>
  <section class="flex flex-row flex-wrap gap-4">
    <GridLink
      v-for="{ title, path, date } in entries"
      :key="path"
      :to="path"
      :title="title"
    >
      <article>
        <header>
          <span>
            {{ title }}
          </span>
          <dl
            v-if="date"
            class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
          >
            <dt class="float-left md:float-none mr-2">Published</dt>
            <dd class="font-semibold mr-4">
              <NuxtTime
                :datetime="date"
                day="numeric"
                month="long"
                year="numeric"
              />
            </dd>
          </dl>
        </header>
      </article>
    </GridLink>
  </section>
</template>

<style scoped>
a:focus,
a:active,
a:hover {
  header span {
    view-transition-name: heading;
  }

  dl dt {
    view-transition-name: published-dt;
  }

  dl dd {
    view-transition-name: published-dd;
  }
}
</style>
