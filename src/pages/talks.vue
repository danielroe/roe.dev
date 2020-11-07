<template>
  <div>
    <header>
      <h2>Talks</h2>
    </header>
    <main>
      <ItemList :class="$style.list">
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

export default defineComponent({
  head: {
    title: 'Talks',
  },
  async fetch() {
    const talks = await this.$content('talks').fetch()
    this.talks = talks.map(formatDateField)
  },
  data: () => ({
    talks: [],
  }),
})
</script>

<style lang="postcss" module>
.list {
  dd + dt {
    /* white-space: pre; */
  }
}
</style>
