<script setup lang="ts">
const entries = await queryContent('/blog')
  .only(['title', 'date', '_path'])
  .find()
  .then(result => {
    return (result as Array<{ title?: string, date: string, _path: string }>)
      .map(e => ({
        ...e,
        path: e._path,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })
</script>

<template>
  <section class="flex flex-col gap-4 max-w-[37.50rem]">
    <NuxtLink
      v-for="{ title, path, date } in entries"
      :key="path"
      :to="path"
      :title="title"
    >
      <article>
        <header class="flex flex-col md:flex-row justify-between items-start">
          <span class="underlined-link">
            {{ title }}
          </span>
          <dl
            v-if="date"
            class="mt-3 md:mt-1 leading-normal uppercase text-xs text-muted"
          >
            <dt class="sr-only">
              Published
            </dt>
            <dd class="mr-4">
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
    </NuxtLink>
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
