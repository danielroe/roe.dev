<script setup lang="ts">
import type { DevRoeAma } from '#shared/lex'

definePageMeta({ layout: false })
useHead({ title: 'AMA - admin - Daniel Roe' })

const route = useRoute()
const rkey = computed(() => {
  const raw = route.params.rkey
  return typeof raw === 'string' && raw ? raw : null
})

if (!rkey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Missing rkey.' })
}

interface AmaEntry {
  rkey: string
  uri: string
  cid: string
  status: 'unanswered' | 'answered'
  question: string
  posts: DevRoeAma.Post[]
  platforms?: DevRoeAma.Platforms
  publishedLinks?: DevRoeAma.PublishedLinks
  image?: unknown
  imageDimensions?: { width: number, height: number }
  backgroundStyle?: string
  createdAt: string
  answeredAt?: string
}

const { data, status } = useAdminFetch<AmaEntry>(`/api/admin/ama/${rkey.value}`, {
  watch: false,
})

// Build a public PDS URL for an already-stored image so the generator can
// show the previously-published version as the initial preview.
const initialImagePreviewUrl = computed(() => {
  if (!data.value?.image) return null
  return useAtprotoBlobUrl(data.value.image)
})
</script>

<template>
  <AdminShell title="Answer">
    <div
      v-if="!data && status === 'pending'"
      class="flex flex-col gap-4"
      aria-hidden="true"
    >
      <section class="bg-accent p-3">
        <h2 class="text-sm text-muted mb-1">
          Question
        </h2>
        <p>
          <AdminSkeleton class="bg-muted/20 w-3/5" />
        </p>
      </section>
      <AdminSkeletonForm
        :fields="['textarea', 'checkbox']"
        width-class=""
      />
    </div>
    <div v-else-if="data">
      <AdminAmaAnswer
        :rkey="data.rkey"
        :question="data.question"
        :created-at="data.createdAt"
        :initial-posts="data.posts"
        :initial-platforms="data.platforms"
        :initial-published-links="data.publishedLinks"
        :initial-image-preview-url="initialImagePreviewUrl"
        :initial-image-dimensions="data.imageDimensions"
        :initial-background-style-id="data.backgroundStyle"
      />
    </div>
  </AdminShell>
</template>
