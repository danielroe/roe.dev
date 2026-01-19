<script setup lang="ts">
interface TalkGroup {
  _id: string
  title: string
  description: string
}

interface Talk {
  _id: string
  title: string
  description?: string
  source: string
  tags: string[]
  link?: string
  video?: string
  date: string
  type: 'conference' | 'podcast' | 'meetup' | 'workshop' | 'stream'
  slides?: string // GitHub release tag
  repo?: string
  demo?: string
  group?: TalkGroup
}

const { data: groups } = await useAsyncData(
  'past-talks',
  async () => {
    try {
      const talks = await $fetch<Talk[]>('/api/talks')

      const groupedTalks: Record<string, [Talk, ...Talk[]]> = {}

      for (const talk of talks) {
        // Use group _id if available, otherwise use individual talk _id
        const groupKey = talk.group?._id || talk._id
        const groupTitle = talk.group?.title || talk.title
        const groupDescription = talk.group?.description || talk.description

        if (groupedTalks[groupKey]) {
          groupedTalks[groupKey]!.push(talk)
        }
        else {
          // Create a talk-like object with group information
          const talkWithGroupInfo = {
            ...talk,
            title: groupTitle,
            description: groupDescription,
          }
          groupedTalks[groupKey] = [talkWithGroupInfo]
        }
      }

      // Sort talks within each group by date (newest first)
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
    }
    catch (error) {
      console.error('Failed to fetch talks:', error)
      return []
    }
  },
)
</script>

<template>
  <section class="flex flex-row flex-wrap gap-4 max-w-[37.50rem]">
    <section
      v-for="[groupKey, talks] of groups"
      :key="groupKey"
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
        :class="{ 'opacity-60': !talk.video && !talk.link && !talk.slides && !talk.demo && !talk.repo }"
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
            v-if="talk.video || (talk.type === 'podcast' && talk.link) || talk.slides || talk.demo || talk.repo"
            class="ml-auto flex items-start"
          >
            <NuxtLink
              v-if="talk.video || (talk.type === 'podcast' && talk.link)"
              :href="talk.video || (talk.type === 'podcast' && talk.link)"
              class="text-xs items-center f-tray-item active:text-primary hover:text-primary focus:text-primary transition-colors"
            >
              <span
                v-if="talk.type === 'podcast' || talk.video"
                :class="talk.video ? 'i-ri:play-line' : 'i-ri:broadcast-line'"
                class="h-4 w-4 flex-shrink-0"
                aria-hidden="true"
              />
              {{ talk.video ? `watch` : `listen` }}
            </NuxtLink>
            <NuxtLink
              v-if="talk.slides"
              class="text-xs items-center f-tray-item active:text-primary hover:text-primary focus:text-primary transition-colors"
              :to="`/slides/${talk.slides}.pdf`"
              data-external
            >
              <span
                class="i-ri:presentation-fill"
                aria-hidden="true"
              /> slides
            </NuxtLink>
            <NuxtLink
              v-if="talk.demo"
              class="text-xs items-center f-tray-item active:text-primary hover:text-primary focus:text-primary transition-colors"
              :to="talk.demo"
              data-external
            >
              <span
                class="i-tabler:sparkles"
                aria-hidden="true"
              /> demo
            </NuxtLink>
            <NuxtLink
              v-if="talk.repo"
              class="text-xs items-center f-tray-item active:text-primary hover:text-primary focus:text-primary transition-colors"
              :to="talk.repo"
              data-external
            >
              <span
                class="i-ri:github-fill"
                aria-hidden="true"
              /> repo
            </NuxtLink>
          </ExpandableTray>
        </header>
      </article>
    </section>
  </section>
</template>
