<template>
  <div>
    <header><h2>Articles</h2></header>
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
              <dl v-if="date">
                <dt>Published</dt>
                <dd>
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
const { data: entries } = await usePageData()
</script>
