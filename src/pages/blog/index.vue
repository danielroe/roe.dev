<template>
  <div>
    <header><h2>Articles</h2></header>
    <main>
      <ItemList>
        <NuxtLink
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
        </NuxtLink>
      </ItemList>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Blog' })
const { data: entries } = await usePageData()
</script>
