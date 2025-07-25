<script setup lang="ts">
const links = [
  {
    name: 'Bluesky',
    icon: 'i-tabler-brand-bluesky',
    link: 'https://bsky.app/profile/danielroe.dev',
  },
  {
    name: 'LinkedIn',
    icon: 'i-ri:linkedin-fill',
    link: 'https://www.linkedin.com/in/daniel-roe/',
  },
  {
    name: 'Mastodon',
    icon: 'i-ri:mastodon-fill',
    link: 'https://mastodon.roe.dev/@daniel',
  },
  {
    name: 'Instagram',
    icon: 'i-ri:instagram-fill',
    link: 'https://www.instagram.com/daniel.c.roe',
  },
]

const [{ data: currentLocation }, { data: upcomingConferences }, { data: streams }, { data: articles }, { data: talks }] = await Promise.all([
  useFetch('/api/current-location'),
  useFetch('/api/upcoming-conferences'),
  useFetch('/api/streams', {
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
  }),
  useAsyncData(async () => {
    const result = await queryCollection('blog').select('title', 'date', 'path').all()
    return result
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
  }),
  useFetch('/api/talks', {
    transform: talks => {
      // Group talks by group or individual ID
      const groupedTalks: Record<string, [Talk, ...Talk[]]> = {}

      for (const talk of talks) {
        const groupKey = talk.group?._id || talk._id
        if (groupedTalks[groupKey]) {
          groupedTalks[groupKey]!.push(talk)
        }
        else {
          groupedTalks[groupKey] = [talk]
        }
      }

      // Sort and get the most recent talk from each group
      const groups = Object.entries(groupedTalks)
        .map(([_groupKey, talksInGroup]) => {
          const sortedTalks = talksInGroup.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          return sortedTalks[0] // Get most recent talk from each group
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return groups.slice(0, 4)
    },
  }),
])

interface Talk {
  _id: string
  title: string
  source: string
  tags: string[]
  link?: string
  video?: string
  date: string
  type: 'conference' | 'podcast' | 'meetup' | 'workshop' | 'mini-workshop' | 'stream'
  slides?: string
  repo?: string
  demo?: string
}
</script>

<template>
  <div>
    <section class="max-w-[37.50rem] text-lg md:text-xl">
      <p>
        I am an open source maintainer and founder, leading the
        <a
          class="underlined-link"
          href="https://nuxt.com"
        >
          Nuxt core team
        </a>.
        Previously, I was CTO of a SaaS startup and founder of a creative agency
        focusing on clarity of vision and message.
      </p>
      <p>
        <NuxtLink
          class="underlined-link text-base"
          to="/bio"
        >
          more about Daniel &raquo;
        </NuxtLink>
      </p>
    </section>
    <template v-if="streams?.length">
      <hr class="block mt-[5vw] my-8 content w-4 border-t-2 border-solid border-gray-700">
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
                  <NuxtImg
                    class="aspect-[1.9] object-cover"
                    format="webp"
                    style="transform: scale(1.11)"
                    width="320"
                    height="168"
                    decoding="async"
                    :preload="index < 2"
                    :loading="index > 1 ? 'lazy' : 'eager'"
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
    </template>
    <template v-if="upcomingConferences?.length">
      <hr class="block my-8 content w-4 border-t-2 border-solid border-gray-700">
      <section

        class="max-w-[37.50rem]"
      >
        <h2 class="text-xl">
          upcoming talks
        </h2>
        <div class="w-screen -mx-4 md:-mx-12 overflow-visible">
          <ul
            class="flex flex-row gap-2 mt-4 overflow-x-scroll snap-mandatory snap-x scroll-smooth px-4 md:px-12"
          >
            <li
              v-for="(conference, index) in upcomingConferences"
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
                  <NuxtImg
                    v-if="conference.image.url"
                    :preload="index < 2"
                    :loading="index > 1 ? 'lazy' : 'eager'"
                    decoding="async"
                    format="webp"
                    :src="conference.image.url"
                    :width="320"
                    :height="Math.round(conference.image.height! / (conference.image.width! / 320))"
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
    </template>
    <hr class="block my-8 content w-4 border-t-2 border-solid border-gray-700">
    <section class="max-w-[37.50rem] overflow-visible">
      <h2 class="text-xl">
        recent talks
      </h2>
      <ul class="flex flex-col mt-4">
        <li
          v-for="talk in talks"
          :key="talk._id"
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
                  v-if="talk.slides"
                  class="active:text-primary hover:text-primary focus:text-primary transition-colors leading-none uppercase text-sm lowercase items-center flex gap-1"
                  :to="`/slides/${talk.slides}.pdf`"
                  data-external
                >
                  <span class="h-4 w-4 i-ri:presentation-fill" />
                  <span class="sr-only"> Slides for {{ talk.title }} </span>
                </NuxtLink>
                <NuxtLink
                  v-if="talk.demo"
                  class="active:text-primary hover:text-primary focus:text-primary transition-colors leading-none uppercase text-sm lowercase items-center flex gap-1"
                  :to="talk.demo"
                  data-external
                >
                  <span class="i-tabler:sparkles" />
                  <span class="sr-only">A demo for {{ talk.title }} </span>
                </NuxtLink>
                <NuxtLink
                  v-if="talk.repo"
                  class="active:text-primary hover:text-primary focus:text-primary transition-colors leading-none uppercase text-sm lowercase items-center flex gap-1"
                  :to="talk.repo"
                  data-external
                >
                  <span class="i-ri:github-fill" />
                  <span class="sr-only">A repo for {{ talk.title }}</span>
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
          :key="article.path"
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
      <p
        v-if="currentLocation && currentLocation.meetupAvailable"
        class="mt-4"
      >
        <span>
          <a
            class="underlined-link"
            :href="`mailto:daniel@roe.dev?subject=Let's meet up in ${currentLocation.city}`"
            data-external
          >
            Drop me a line
          </a>
          if you'd like to meet up in person! I'm planning to be in {{ currentLocation.city }}, {{ currentLocation.area }} today.
        </span>
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
      <p class="mt-4">
        <NuxtLink
          to="/blog/funding"
          class="underlined-link text-sm"
        >
          more about how I'm funded &raquo;
        </NuxtLink>
      </p>
    </section>
  </div>
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
