<script setup lang="ts">
interface Talk {
  slug: string
  group?: string
  description?: string
  title: string
  source: string
  tags: string
  link: string
  date: string
  type: 'talk' | 'podcast' | 'meetup' | 'talk' | 'conference' | 'mini-workshop'
  video?: string
  release?: string
}

// if (process.env.prerender && process.server) {
//   for (const conference of upcomingConferences) {
//     await useStorage().setItem(conference.image, conference.link)
//     appendHeader(
//       useRequestEvent(),
//       'x-nitro-prerender',
//       '/thumbnail/' + conference.image
//     )
//   }
// }

const { data: groups } = await useAsyncData(
  () =>
    ((process.server || process.dev) as true) &&
    import('../data/talks.json').then(r => r.default as any as Talk[]),
  {
    transform: talks => {
      const groupedTalks: Record<string, Talk[]> = {}
      for (const talk of talks) {
        const slug = talk.group || talk.slug
        groupedTalks[slug] ||= []
        groupedTalks[slug].push(talk)
      }

      for (const group in groupedTalks) {
        groupedTalks[group].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      }

      const groups = Object.entries(groupedTalks).sort(
        ([_s1, [a]], [_s2, [b]]) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
      )

      return groups
    },
  }
)
</script>

<template>
  <section class="flex flex-row flex-wrap gap-4 max-w-[37.50rem]">
    <section
      v-for="[slug, talks] of groups"
      :key="slug"
      class="mb-2 w-full relative flex flex-col justify-end min-h-12 transition-all border-1 border-solid border-transparent after:text-transparent flex-[100%]"
    >
      <div class="flex flex-row items-center gap-2 text-xl">
        {{ talks[0].title }}
      </div>
      <div v-if="talks[0].description" class="text-base mb-1">
        {{ talks[0].description }}
      </div>
      <article
        v-for="{ title, source, link, date, type, video, release } of talks"
        :key="link"
        :class="{ 'opacity-60': !video && !link && !release }"
        :alt="title"
      >
        <header class="flex flex-row mt-1">
          <dl
            v-if="date"
            class="flex flex-row items-center gap-4 leading-normal text-sm w-full"
          >
            <dt class="sr-only">Date</dt>
            <dd class="md:min-w-24 uppercase opacity-60 text-xs flex-shrink-0">
              <NuxtTime
                :datetime="date"
                day="numeric"
                month="short"
                year="numeric"
              />
            </dd>
            <dt v-if="source" class="sr-only">Where</dt>
            <dd v-if="source" class="text-ellipsis line-clamp-1">
              {{ source }}
            </dd>
          </dl>
          <ExpandableTray
            v-if="video || link || release"
            class="ml-auto flex flex-row gap-2 items-start"
          >
            <NuxtLink
              v-if="video || link"
              :href="video || link"
              class="text-xs items-center"
            >
              <span
                v-if="type === 'podcast' || video"
                :class="video ? 'i-ri:play-line' : 'i-ri:broadcast-line'"
                class="h-4 w-4 flex-shrink-0"
              />
              {{ video ? `watch` : `listen` }}
            </NuxtLink>
            <NuxtLink
              v-if="release"
              class="text-xs items-center"
              :to="`/slides/${release}.pdf`"
              data-external
            >
              <span class="i-ri:presentation-fill" /> slides
            </NuxtLink>
          </ExpandableTray>
        </header>
      </article>
    </section>
  </section>
</template>
