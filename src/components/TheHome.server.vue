<script setup lang="ts">
const links = [
  {
    name: 'LinkedIn',
    icon: 'i-ri:linkedin-fill',
    link: 'https://www.linkedin.com/in/daniel-roe/',
  },
  {
    name: 'Twitter',
    icon: 'i-custom-twitter',
    link: 'https://twitter.com/danielcroe',
  },
  {
    name: 'Mastodon',
    icon: 'i-ri:mastodon-fill',
    link: 'https://mastodon.roe.dev/@daniel',
  },
  {
    name: 'Bluesky',
    icon: 'i-tabler-brand-bluesky',
    link: 'https://bsky.app/profile/danielroe.dev',
  },
  {
    name: 'Threads',
    icon: 'i-custom-threads',
    link: 'https://www.threads.net/@daniel.c.roe',
  },
]

const upcomingConferences: Array<{
  name: string
  dates: string
  link: string
  location: string
  image: string
}> = [
  {
    name: 'Vue.js Nation',
    dates: '24-25 January',
    link: 'https://vuejsnation.com/',
    location: '🌍',
    image: 'https://vuejsnation.com/images/thumbnail-2024.jpg',
  },
  {
    name: 'Vue.js Amsterdam',
    dates: '28-29 February',
    link: 'https://vuejs.amsterdam/',
    location: '🇳🇱',
    image:
      'https://images.jsworldconference.com/logo_vuejs_amsterdam_b4b41918cb.svg?width=400',
  },
  {
    name: 'CityJS London',
    dates: '3-5 April',
    link: 'https://london.cityjsconf.org/',
    location: '🇬🇧',
    image: 'https://cityjsconf.org/images/site/2019.jpg',
  },
  {
    name: 'Vueconf US',
    dates: '15-17 May',
    link: 'https://vueconf.us/',
    location: '🇺🇸',
    image: 'https://vueconf.us/__og-image__/image/og.png',
  },
  {
    name: 'Middlesborough FE',
    dates: '17 July',
    link: 'https://middlesbroughfe.co.uk/',
    location: '🇬🇧',
    image: 'https://www.middlesbroughfe.co.uk/images/Web_OG.png',
  },
]

const { data: streams } = await useFetch('/api/streams', {
  transform: streams =>
    streams.slice(0, 5).map(stream => ({
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
})

const { data: articles } = await useAsyncData(async () => {
  const result = await queryContent('/blog')
    .only(['title', 'date', '_path'])
    .find()
  return (result as Array<{ title?: string; date: string; _path: string }>)
    .map(e => ({
      ...e,
      path: e._path,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
})

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

const { data: talks } = await useAsyncData(
  () =>
    ((import.meta.server || import.meta.dev) as true) &&
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

      return groups.slice(0, 4).map(([slug, [firstTalk]]) => firstTalk)
    },
  }
)
</script>

<template>
  <section class="max-w-[37.50rem] text-lg md:text-xl">
    <p>
      I am an open-source maintainer and founder, leading the
      <a
        class="underlined-link"
        href="https://nuxt.com"
      >Nuxt core team</a>.
      Previously, I was CTO of a SaaS startup and founder of a creative agency
      focusing on clarity of vision and message.
    </p>
    <!-- TODO: create /bio page -->
    <!-- <p>
          <NuxtLink class="underlined-link text-base" to="/bio">
            more about Daniel &raquo;
          </NuxtLink>
        </p> -->
  </section>
  <hr
    class="block mt-[5vw] my-8 content w-4 border-t-2 border-solid border-gray-700"
  >
  <section class="max-w-[37.50rem]">
    <h2 class="text-xl">
      some recent streams
    </h2>
    <div class="w-screen -mx-4 md:-mx-12 overflow-visible">
      <ul
        class="flex flex-row gap-2 mt-4 overflow-x-scroll overflow-y-visible snap-mandatory snap-x scroll-smooth px-4 md:px-12"
      >
        <li
          v-for="(video, index) of streams"
          :key="video.title"
          class="snap-start px-4 md:px-12 -mx-4 md:-mx-12"
        >
          <NuxtLink
            class="bg-accent w-[20rem] justify-between flex flex-col"
            :to="video.link"
          >
            <div
              class="relative flex flex-col justify-end bg-gray-900 w-[20rem] h-[8rem] overflow-hidden"
            >
              <nuxt-img
                class="aspect-[1.9] object-cover"
                format="webp"
                style="transform: scale(1.11)"
                width="762"
                height="400"
                decoding="async"
                :loading="index > 2 ? 'lazy' : 'eager'"
                :alt="`Still thumbnail for ${video.title}`"
                :src="video.thumbnail"
              />
            </div>
            <div class="px-2 py-1 flex flex-row justify-between items-end">
              <div class="text-ellipsis line-clamp-1 py-1 leading-none">
                {{ video.title }}
              </div>
              <NuxtTime
                :datetime="video.date"
                class="flex-shrink-0 uppercase text-xs text-muted leading-none py-1"
                day="numeric"
                month="long"
              />
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div class="mt-4 flex flex-row gap-2 items-center flex-wrap w-100vw">
      <span class="text-base"> you can watch more videos </span>
      <ExpandableTray>
        <a
          href="https://twitch.tv/danielroe"
          class="outline-none active:text-primary hover:text-primary focus:text-primary transition-colors text-sm items-center flex gap-1"
          aria-label="Watch more streams on Twitch"
        >
          <span class="i-ri-twitch-fill h-5 w-5 md:h-4 md:w-4" />
          <span class="hidden md:inline-block">twitch</span>
        </a>
        <a
          href="https://youtube.com/@danielroe"
          class="outline-none active:text-primary hover:text-primary focus:text-primary transition-colors text-sm items-center flex gap-1"
          aria-label="Watch more videos on YouTube"
        >
          <span class="i-ri-youtube-fill h-5 w-5 md:h-4 md:w-4" />
          <span class="hidden md:inline-block">youtube</span>
        </a>
      </ExpandableTray>
      <span class="text-base">
        or check out
        <NuxtLink
          class="underlined-link"
          to="/uses"
        > what I use </NuxtLink>.
      </span>
    </div>
  </section>
  <hr class="block my-8 content w-4 border-t-2 border-solid border-gray-700">
  <section class="max-w-[37.50rem]">
    <h2 class="text-xl">
      upcoming conferences
    </h2>
    <div class="w-screen -mx-4 md:-mx-12 overflow-visible">
      <ul
        class="flex flex-row gap-2 mt-4 overflow-x-scroll snap-mandatory snap-x scroll-smooth px-4 md:px-12"
      >
        <li
          v-for="conference in upcomingConferences"
          :key="conference.name"
          class="snap-start px-4 md:px-12 -mx-4 md:-mx-12"
        >
          <NuxtLink
            :to="conference.link"
            class="bg-accent w-[20rem] justify-between flex flex-col"
          >
            <div
              class="relative flex flex-col justify-center bg-gray-900 w-[20rem] h-[8rem] overflow-hidden"
            >
              <nuxt-img
                loading="lazy"
                decoding="async"
                format="webp"
                :src="conference.image"
                :alt="`Logo for ${conference.name}`"
                class="object-cover object-center"
              />
            </div>
            <div
              class="px-2 py-2 flex flex-row justify-between items-end leading-none"
            >
              <span class="flex flex-row items-center gap-2">
                <span
                  class="rounded-full h-5 w-5 bg-primary inline-flex items-center justify-center"
                >
                  {{ conference.location }}
                </span>
                {{ conference.name }}
              </span>
              <span class="uppercase text-xs text-muted">
                {{ conference.dates }}
              </span>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
    <!-- TODO: add link for conference organisers -->
  </section>
  <hr class="block my-8 content w-4 border-t-2 border-solid border-gray-700">
  <section class="max-w-[37.50rem] overflow-visible">
    <h2 class="text-xl">
      recent talks
    </h2>
    <ul class="flex flex-col mt-4">
      <li
        v-for="talk in talks"
        :key="talk.slug"
        class="mt-2 first:mt-0"
      >
        <div
          class="flex flex-col py-1 md:flex-row md:justify-between md:items-center"
        >
          <div
            class="flex flex-row items-baseline w-full md:w-auto justify-between md:justify-start"
          >
            <span class="mr-2 leading-snug">
              {{ talk.title }}
            </span>
            <ExpandableTray class="-mb-4 md:mb-0">
              <NuxtLink
                v-if="talk.video || talk.link"
                :href="talk.video || talk.link"
                class="active:text-primary hover:text-primary focus:text-primary transition-colors leading-none text-sm lowercase items-center flex gap-1"
              >
                <span
                  v-if="talk.type === 'podcast' || talk.video"
                  :class="talk.video ? 'i-ri:play-line' : 'i-ri:broadcast-line'"
                  class="h-5 w-5 md:h-4 md:w-4"
                />
                <span class="sr-only">
                  {{ talk.video ? `Watch` : `Listen` }} to {{ talk.title }}
                </span>
              </NuxtLink>
              <NuxtLink
                v-if="talk.release"
                class="active:text-primary hover:text-primary focus:text-primary transition-colors leading-none uppercase text-sm lowercase items-center flex gap-1"
                :to="`/slides/${talk.release}.pdf`"
                data-external
              >
                <span class="h-4 w-4 i-ri:presentation-fill" />
                <span class="sr-only"> Slides for {{ talk.title }} </span>
              </NuxtLink>
            </ExpandableTray>
          </div>

          <NuxtTime
            class="text-muted uppercase text-xs mt-1"
            :datetime="talk.date"
            day="numeric"
            month="long"
            year="numeric"
          />
        </div>
      </li>
    </ul>
    <NuxtLink
      class="mt-4 underlined-link text-base"
      to="/talks"
    >
      more talks &raquo;
    </NuxtLink>
  </section>
  <hr class="block my-8 content w-4 border-t-2 border-solid border-gray-700">
  <section class="max-w-[37.50rem] overflow-visible">
    <h2 class="text-xl">
      latest from the blog
    </h2>
    <ul class="flex flex-col mt-4">
      <li
        v-for="article in articles"
        :key="article._path"
        class="py-2"
      >
        <NuxtLink
          :to="article.path"
          class="flex flex-col items-start gap-3 justify-between md:flex-row md:items-center"
        >
          <div class="underlined-link">
            {{ article.title }}
          </div>

          <NuxtTime
            class="text-muted uppercase text-xs"
            :datetime="article.date"
            day="numeric"
            month="long"
            year="numeric"
          />
        </NuxtLink>
      </li>
    </ul>
    <NuxtLink
      class="mt-4 underlined-link text-base"
      to="/blog"
    >
      more articles &raquo;
    </NuxtLink>
  </section>
  <hr class="block my-8 content w-4 border-t-2 border-solid border-gray-700">
  <section class="text-lg max-w-[50rem]">
    <h2 class="text-xl">
      contact me
    </h2>
    <p class="mt-4">
      I'd love to connect on social media
      <ExpandableTray class="gap-4 md:gap-2">
        <a
          v-for="link in links"
          :key="link.name"
          :href="link.link"
          :aria-label="`Follow me on ${link.name}`"
          class="outline-none active:text-primary hover:text-primary focus:text-primary transition-colors text-sm lowercase items-center flex gap-1"
        >
          <span
            :class="link.icon"
            class="h-4 w-4"
          />
          <span class="hidden md:inline-block">{{ link.name }}</span>
        </a>
      </ExpandableTray>
      or you can view an
      <NuxtLink
        class="underlined-link"
        to="/feed"
      >
        aggregated feed on this site
      </NuxtLink>. You can also get in touch
      <a
        class="underlined-link"
        href="mailto:daniel@roe.dev"
        data-external
      >
        by email
      </a>
      &mdash; and I have an open diary if you want to
      <NuxtLink
        class="underlined-link"
        to="/blog/open-invitation"
      >
        book a meeting
      </NuxtLink>.
    </p>
  </section>
  <hr class="block my-8 content w-4 border-t-2 border-solid border-gray-700">
  <section class="max-w-[75rem]">
    <header class="text-xl mb-4">
      special thanks to
      <!-- TODO: scrolling? -->
      <template v-if="$auth.user.sponsor">
        <span class="text-primary">you</span>
        and
      </template>
    </header>
    <!-- TODO: use randomised sponsor list -->
    <TheSponsors />
    <!-- <p class="mt-4">
          <NuxtLink to="/blog/funding" class="underlined-link text-sm">
            more about how I'm funded &raquo;
          </NuxtLink>
        </p> -->
  </section>
</template>

<style>
.overflow-x-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.overflow-x-scroll::-webkit-scrollbar {
  display: none;
}
</style>
