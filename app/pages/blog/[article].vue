<template>
  <main class="text-muted flex-grow px-4 py-2 md:px-12 md:py-4 w-full max-w-[37.50rem]">
    <header
      v-if="page"
      class="leading-none mt-[5vw] mb-[1vw]"
    >
      <h1 class="text-2xl">
        {{ page.title }}
      </h1>
      <dl
        v-if="page.date"
        class="block md:flex flex-row flex-wrap mt-1 leading-normal uppercase text-xs"
      >
        <dt class="float-left md:float-none mr-2">
          Published
        </dt>
        <dd class="mr-4">
          <NuxtTime
            :datetime="page.date"
            day="numeric"
            month="long"
            year="numeric"
          />
        </dd>
        <template v-if="page.tags && page.tags.length">
          <dt class="float-left md:float-none mr-2">
            Tags
          </dt>
          <dd class="mr-4">
            <span
              v-for="(tag, index) in page.tags"
              :key="tag"
              :class="{
                'before:content-empty before:mx-1 before:inline-block': index,
              }"
              v-text="tag"
            />
          </dd>
        </template>
      </dl>
    </header>
    <section
      v-if="page"
      :class="$style.blog"
    >
      <StaticMarkdownRender
        collection="blog"
        :path="path"
      />
    </section>
    <WebMentions />
  </main>
</template>

<script lang="ts" setup>
const route = useRoute('blog-article')
const slug = route.params.article
if (!slug) navigateTo('/blog')

const path = computed(() =>
  route.path.replace(/(index)?\.json$/, '').replace(/\/$/, ''),
)

const { data: page } = await useAsyncData(
  path.value,
  () =>
    ((import.meta.server || import.meta.dev) as true)
    && queryCollection('blog').path(path.value)
      .select('title', 'date', 'tags', 'description')
      .first(),
)

if (!page.value) {
  throw createError({
    statusCode: 404,
    fatal: true,
  })
}

route.meta.title = page.value.title

const formatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
})

defineOgImageComponent('DefaultImage', {
  date: formatter.format(new Date(page.value.date)),
  title: page.value.title,
  tags: page.value.tags,
})

if (import.meta.server) {
  useRoute().meta.description = page.value.description
}
</script>

<style scoped>
header>h1:first-child {
  view-transition-name: heading;
}

header dl dt:first-of-type {
  view-transition-name: published-dt;
}

header dl dd:first-of-type {
  view-transition-name: published-dd;
}
</style>

<style module>
.blog {
  h2 {
    @apply uppercase text-sm;

    letter-spacing: 0.1rem;
  }

  *+h2,
  *+h3,
  *+h4 {
    @apply mt-8;
  }

  div+div {
    @apply mb-6;
  }

  pre {
    @apply font-code text-sm my-0;

    background-color: theme('colors.gray.900') !important;
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw !important;

    @media (width < 767px) {
      white-space: pre-wrap;
    }

    +h2,
    +h3,
    +h4 {
      @apply mt-8;
    }

    +p {
      @apply mt-6;
    }
  }

  ol,
  ul {
    @apply pl-6;

    li {
      @apply my-4;

      counter-increment: list;

      &::before {
        @apply -ml-6 mt-2 mr-2 inline-block leading-none;

        width: 1rem;
      }

      > :first-child:not(strong) {
        @apply inline-block;
      }
    }
  }

  ul li::before {
    content: '›';
  }

  ol li::before {
    @apply text-xs;

    content: counter(list);
  }

  /* stylelint-disable-next-line */
  p {
    +pre,
    +p {
      @apply mt-4;
    }

    +ul,
    +ol {
      @apply my-2;
    }

    +table {
      @apply my-4;
    }
  }

  p>code,
  li>code {
    @apply px-2 py-1 mx-1 text-sm text-background bg-primary;
  }

  p+div {
    @apply mt-6 py-1 uppercase text-xs text-gray-600;

    letter-spacing: 0.15rem;
    background-color: theme('colors.gray.900');
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 1rem 50vw;
  }

  blockquote {
    @apply pl-4 border-l-4 mb-4;
  }
}
</style>
