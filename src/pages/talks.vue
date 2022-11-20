<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[70ch]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Talks</h1>
    </header>
    <main class="text-lg">
      <section class="flex flex-row flex-wrap gap-4">
        <GridLink
          v-for="{
            title,
            source,
            link,
            date,
            type,
            video,
            formattedDate,
          } in talks"
          :key="link"
          :alt="title"
          :href="video || link"
        >
          <article>
            <header>
              <div class="flex flex-row items-center gap-2">
                <svg
                  v-if="type === 'podcast' || video"
                  class="h-4 w-4 fill-current"
                  :alt="video ? `Play ${title}` : `Listen to ${title}`"
                >
                  <use :xlink:href="video ? '#play' : '#audio'" />
                </svg>
                {{ title }}
              </div>
              <dl
                v-if="date"
                class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
              >
                <dt class="float-left md:float-none mr-2">Date</dt>
                <dd class="font-semibold mr-4">
                  <time :datetime="date">{{ formattedDate }}</time>
                </dd>
                <dt v-if="source" class="float-left md:float-none mr-2">
                  Where
                </dt>
                <dd v-if="source" class="font-semibold mr-4">
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
definePageMeta({ title: 'Talks' })

interface Talk {
  title: string
  source: string
  tags: string
  link: string
  date: string
  type: 'talk' | 'podcast' | 'meetup' | 'talk' | 'conference' | 'mini-workshop'
  video?: string
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
