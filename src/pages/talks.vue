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
useHead({
  title: 'Talks',
})
const { data: talks } = await usePageData()
</script>
