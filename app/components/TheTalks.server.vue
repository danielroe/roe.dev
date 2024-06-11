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
  repo?: string
  demo?: string
}

// if (import.meta.prerender && import.meta.server) {
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
    ((import.meta.server || import.meta.dev) as true)
    && import('../data/talks.json').then(r => r.default as any as Talk[]),
  {
    transform: talks => {
      const groupedTalks: Record<string, [Talk, ...Talk[]]> = {}
      for (const talk of talks) {
        const slug = talk.group || talk.slug
        if (groupedTalks[slug]) {
          groupedTalks[slug]!.push(talk)
        }
        else {
          groupedTalks[slug] = [talk]
        }
      }

      for (const group in groupedTalks) {
        groupedTalks[group]!.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
      }

      const groups = Object.entries(groupedTalks).sort(
        ([_s1, [a]], [_s2, [b]]) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        },
      )

      return groups
    },
  },
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
      <div
        v-if="talks[0].description"
        class="text-base mb-1"
      >
        {{ talks[0].description }}
      </div>
      <article
        v-for="talk of talks"
        :key="talk.link"
        :class="{ 'opacity-60': !talk.video && !talk.link && !talk.release && !talk.demo && !talk.repo }"
        :alt="talk.title"
      >
        <header class="flex flex-row mt-1">
          <dl
            v-if="talk.date"
            class="flex flex-row items-center gap-4 leading-normal text-sm w-full"
          >
            <dt class="sr-only">
              Date
            </dt>
            <dd class="md:min-w-24 uppercase opacity-60 text-xs flex-shrink-0">
              <NuxtTime
                :datetime="talk.date"
                day="numeric"
                month="short"
                year="numeric"
              />
            </dd>
            <dt
              v-if="talk.source"
              class="sr-only"
            >
              Where
            </dt>
            <dd
              v-if="talk.source"
              class="text-ellipsis line-clamp-1"
            >
              {{ talk.source }}
            </dd>
          </dl>
          <ExpandableTray
            v-if="talk.video || talk.link || talk.release || talk.demo || talk.repo"
            class="ml-auto flex items-start"
          >
            <NuxtLink
              v-if="talk.video || talk.link"
              :href="talk.video || talk.link"
              class="text-xs items-center"
            >
              <span
                v-if="talk.type === 'podcast' || talk.video"
                :class="talk.video ? 'i-ri:play-line' : 'i-ri:broadcast-line'"
                class="h-4 w-4 flex-shrink-0"
              />
              {{ talk.video ? `watch` : `listen` }}
            </NuxtLink>
            <NuxtLink
              v-if="talk.release"
              class="text-xs items-center"
              :to="`/slides/${talk.release}.pdf`"
              data-external
            >
              <span class="i-ri:presentation-fill" /> slides
            </NuxtLink>
            <NuxtLink
              v-if="talk.demo"
              class="text-xs items-center"
              :to="talk.demo"
              data-external
            >
              <span class="i-tabler:sparkles" /> demo
            </NuxtLink>
            <NuxtLink
              v-if="talk.repo"
              class="text-xs items-center"
              :to="talk.repo"
              data-external
            >
              <span class="i-ri:github-fill" /> repo
            </NuxtLink>
          </ExpandableTray>
        </header>
      </article>
    </section>
  </section>
</template>
