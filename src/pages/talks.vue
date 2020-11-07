<template>
  <div>
    <header>
      <h2>Talks</h2>
    </header>
    <main>
      <ItemList>
        <a
          v-for="{
            title,
            name,
            type,
            source,
            tags,
            link,
            date,
            formattedDate,
          } in talks"
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

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

import { formatDateField } from '~/utils/dates'

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

export default defineComponent({
  head: {
    title: 'Talks',
  },
  async fetch() {
    const talks: Talk[] = (await this.$content('talks').fetch()) as any
    talks.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    this.talks = talks.map(formatDateField)
  },
  data: () => ({
    talks: [] as Talk[],
  }),
})
</script>
