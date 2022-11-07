<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[70ch]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h2 class="text-2xl">Talks</h2>
    </header>
    <main class="text-lg">
      <section class="flex flex-row flex-wrap gap-4">
        <GridLink
          v-for="{ title, source, link, date, formattedDate } in talks"
          :key="link"
          :alt="title"
          :href="link"
        >
          <article>
            <header>
              {{ title }}
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
useHead({
  title: 'Talks',
})

interface Talk {
  title: string
  source: string
  tags: string
  link: string
  date: string
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
