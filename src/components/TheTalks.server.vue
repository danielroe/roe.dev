<script setup lang="ts">
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

const upcomingConferences = [
  {
    name: 'WeAreDevs World Congress',
    dates: '27-28 July, 2023',
    link: 'https://www.wearedevelopers.com/world-congress',
    location: 'Berlin, Germany',
    image: 'wearedevs-world-congress.jpg',
  },
  {
    name: 'Digital Labin',
    dates: '22-23 September, 2023',
    link: 'https://digital-labin.com/',
    location: 'Labin, Istria, Croatia',
    image: 'digital-labin.jpg',
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

const [{ data: talks }, { data: streams }] = await Promise.all([
  useAsyncData(
    () =>
      ((process.server || process.dev) as true) &&
      import('../data/talks.json').then(r => r.default as any as Talk[]),
    {
      transform: talks =>
        talks.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
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
    <GridLink
      v-for="{ title, source, link, date, type, video } of talks"
      :key="link"
      :alt="title"
      :href="video || link"
    >
      <article>
        <header>
          <div class="flex flex-row items-center gap-2">
            <span
              v-if="type === 'podcast' || video"
              :class="video ? 'i-ri:play-line' : 'i-ri:broadcast-line'"
              class="h-4 w-4 flex-shrink-0"
              :alt="video ? `Play ${title}` : `Listen to ${title}`"
            />
            {{ title }}
          </div>
          <dl
            v-if="date"
            class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
          >
            <dt class="float-left md:float-none mr-2">Date</dt>
            <dd class="font-semibold mr-4">
              <NuxtTime
                :datetime="date"
                day="numeric"
                month="long"
                year="numeric"
              />
            </dd>
            <dt v-if="source" class="float-left md:float-none mr-2">Where</dt>
            <dd v-if="source" class="font-semibold mr-4">
              {{ source }}
            </dd>
          </dl>
        </header>
      </article>
    </GridLink>
  </section>
</template>
