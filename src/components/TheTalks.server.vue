<script setup lang="ts">
interface Talk {
  slug: string
  group?: string
  title: string
  source: string
  tags: string
  link: string
  date: string
  type: 'talk' | 'podcast' | 'meetup' | 'talk' | 'conference' | 'mini-workshop'
  video?: string
  release?: string
}

const upcomingConferences = [
  {
    name: 'TypeScript Congress',
    dates: '21-22 September, 2023',
    link: 'https://typescriptcongress.com/',
    location: 'Remote',
    image: 'typescript-congress.jpg',
  },
  {
    name: 'Digital Labin',
    dates: '22-23 September, 2023',
    link: 'https://digital-labin.com/',
    location: 'Labin, Istria, Croatia',
    image: 'digital-labin.jpg',
  },
  {
    name: 'ViteConf',
    dates: '5 October, 2023',
    link: 'https://viteconf.org/',
    location: 'Remote',
    image: 'viteconf.jpg',
  },
  {
    name: 'Armada JS',
    dates: '5-6 October, 2023',
    link: 'https://armada-js.com/',
    location: 'Novi Sad, Serbia',
    image: 'armada-js.jpg',
  },
  {
    name: 'VueFes Japan',
    dates: '28 October, 2023',
    link: 'https://vuefes.jp/2023/',
    location: 'Nakano, Tokyo',
    image: 'vuefes-japan.jpg',
  },
  {
    name: 'JetBrains JavaScript Day 2023',
    dates: '2 November, 2023',
    location: 'Remote',
    image: 'jetbrains-day.jpg',
  },
  {
    name: 'vueday 2023',
    dates: '10 November, 2023',
    link: 'https://2023.vueday.it/',
    location: 'Verona, Italy',
    image: 'vuefes-japan.jpg',
  },
]

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

const [{ data: groups }, { data: streams }] = await Promise.all([
  useAsyncData(
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
  ),
  useFetch('/api/streams', {
    transform: streams =>
      streams.slice(0, 4).map(stream => ({
        title: stream.title,
        thumbnail: stream.thumbnail_url
          .replace('%{width}', '1200')
          .replace('%{height}', '630'),
        source: 'Twitch',
        link: stream.url,
        date: stream.created_at,
        type: 'video',
        video: stream.url,
      })),
  }),
])
</script>

<template>
  <section class="flex flex-row flex-wrap gap-4">
    <h2 class="uppercase text-sm font-bold tracking-widest">
      Upcoming conferences
    </h2>
    <GridLink
      v-for="conference of upcomingConferences"
      :key="conference.name"
      :href="conference.link"
    >
      <article class="flex flex-row gap-4">
        <!-- <img
              class="aspect-[1.9] w-[150px] -ml-4 my-[-.88rem]"
              width="1200"
              height="630"
              :alt="'Home page of ' + conference.name"
              :src="'/thumbnail/' + conference.image"
            /> -->
        <header class="flex-grow">
          {{ conference.name }}
          <dl
            class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
          >
            <dt class="float-left md:float-none mr-2">When</dt>
            <dd class="font-semibold mr-4">
              {{ conference.dates }}
            </dd>
            <dt class="float-left md:float-none mr-2">Where</dt>
            <dd class="font-semibold mr-4">
              {{ conference.location }}
            </dd>
          </dl>
        </header>
      </article>
    </GridLink>
  </section>
  <section class="mt-12 flex flex-row flex-wrap gap-4">
    <header
      class="flex flex-row justify-between gap-2 w-full items-center uppercase text-sm font-bold tracking-widest"
    >
      <h2 class="flex flex-row gap-1 items-center">
        <span class="i-ri:twitch-fill" />
        Latest streams
      </h2>
      <a class="text-sm" href="https://twitch.tv/danielroe"> more </a>
    </header>
    <GridLink v-for="video of streams" :key="video.title" :href="video.video">
      <article class="flex flex-row gap-4">
        <header class="flex-grow">
          {{ video.title }}
          <dl
            class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
          >
            <dt class="float-left md:float-none mr-2">Date</dt>
            <dd class="font-semibold mr-4">
              <NuxtTime
                :datetime="video.date"
                day="numeric"
                month="long"
                year="numeric"
              />
            </dd>
          </dl>
        </header>
        <nuxt-img
          class="aspect-[1.9] w-[150px] -mr-4 my-[-.88rem] object-cover object-left-top"
          width="1200"
          height="630"
          :alt="`Still thumbnail for ${video.title}`"
          :src="video.thumbnail"
        />
      </article>
    </GridLink>
  </section>
  <section class="mt-12 flex flex-row flex-wrap gap-4">
    <h2 class="uppercase text-sm font-bold tracking-widest">Past talks</h2>
    <section
      v-for="[slug, talks] of groups"
      :key="slug"
      class="bg-accent p-4 relative text-xl flex flex-col justify-end min-h-12 transition-all border-1 border-solid border-transparent after:text-transparent flex-[100%]"
    >
      <div class="flex flex-row items-center gap-2">
        {{ talks[0].title }}
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
            class="flex flex-row gap-4 flex-wrap leading-normal text-xs uppercase"
          >
            <dt class="sr-only">Date</dt>
            <dd class="font-semibold min-w-24">
              <NuxtTime
                :datetime="date"
                day="numeric"
                month="short"
                year="numeric"
              />
            </dd>
            <dt v-if="source" class="sr-only">Where</dt>
            <dd v-if="source" class="font-semibold">
              {{ source }}
            </dd>
          </dl>
          <div
            v-if="video || link || release"
            class="ml-auto flex flex-row gap-2 items-start"
          >
            <NuxtLink
              v-if="video || link"
              :href="video || link"
              class="underlined-link leading-normal uppercase text-xs font-bold items-center"
            >
              <span
                v-if="type === 'podcast' || video"
                :class="video ? 'i-ri:play-line' : 'i-ri:broadcast-line'"
                class="h-4 w-4 flex-shrink-0"
              />
              {{ video ? `Watch` : `Listen` }}
            </NuxtLink>
            <NuxtLink
              v-if="release"
              class="underlined-link leading-normal uppercase text-xs font-bold items-center"
              :to="`/slides/${release}.pdf`"
              data-external
            >
              <span class="i-ri:presentation-fill" /> PDF
            </NuxtLink>
          </div>
        </header>
      </article>
    </section>
  </section>
</template>
