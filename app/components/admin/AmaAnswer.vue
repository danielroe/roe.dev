<script setup lang="ts">
import type { DevRoeAma, DevRoeEntity, ComAtprotoRepoStrongRef } from '#shared/lex'

interface EntityEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeEntity.Record
}

type AmaPlatform = 'bluesky' | 'mastodon' | 'linkedin' | 'youtubeShorts'
const ALL_PLATFORMS: AmaPlatform[] = ['bluesky', 'mastodon', 'linkedin', 'youtubeShorts']

interface PlatformState {
  status: 'idle' | 'publishing' | 'success' | 'failed'
  url?: string
  error?: string
}

const props = defineProps<{
  rkey: string
  question: string
  createdAt: string
  initialPosts?: DevRoeAma.Post[]
  initialPlatforms?: DevRoeAma.Platforms
  initialPublishedLinks?: DevRoeAma.PublishedLinks
  /** Public URL of any already-published image, for the generator's initial preview. */
  initialImagePreviewUrl?: string | null
  initialImageDimensions?: { width: number, height: number }
  initialBackgroundStyleId?: string
}>()

const FOOTER_PREVIEW_LENGTH = '\n\nroe.dev/ama\n\n#ama'.length
const BLUESKY_LIMIT = 300

const { data: entities } = useFetch<EntityEntry[]>('/api/admin/entities', { default: () => [] })

interface DraftPost {
  text: string
  mentions: ComAtprotoRepoStrongRef.Main[]
}

const posts = ref<DraftPost[]>(
  (props.initialPosts ?? [{ text: '' }]).map(p => ({
    text: p.text,
    mentions: (p.mentions ?? []) as ComAtprotoRepoStrongRef.Main[],
  })),
)
if (!posts.value.length) posts.value = [{ text: '', mentions: [] }]

const platforms = reactive({
  bluesky: props.initialPlatforms?.bluesky ?? true,
  mastodon: props.initialPlatforms?.mastodon ?? true,
  linkedin: props.initialPlatforms?.linkedin ?? true,
  youtubeShorts: props.initialPlatforms?.youtubeShorts ?? false,
})

// Seed per-platform state from the existing record so a returning editor
// sees "already published" rather than being prompted to re-post.
const platformState = reactive<Record<AmaPlatform, PlatformState>>(
  Object.fromEntries(ALL_PLATFORMS.map(p => {
    const url = props.initialPublishedLinks?.[p]
    return [p, url ? { status: 'success', url } : { status: 'idle' }]
  })) as Record<AmaPlatform, PlatformState>,
)

// Generated media, held in memory until publish. Images upload to the PDS
// at publish time (unreferenced PDS blobs are GC'd); video goes straight
// to YouTube and isn't persisted on the PDS.
interface PendingImage {
  blob: Blob
  width: number
  height: number
  backgroundStyleId: string
}
interface PendingVideo {
  blob: Blob
  width: number
  height: number
  durationSeconds: number
}
const pendingImage = ref<PendingImage | null>(null)
const pendingVideo = ref<PendingVideo | null>(null)

// Plain-text answer for the video generator + YouTube description, with
// entity mention placeholders swapped for bare names.
const plainAnswerForVideo = computed(() => posts.value
  .map(p => p.text
    .replace(/@([a-z0-9]{13})\b/g, (_match, rkey) => {
      const ent = (entities.value ?? []).find(e => e.rkey === rkey)
      return ent ? `@${ent.value.name}` : ''
    })
    .replace(/  +/g, ' '))
  .filter(Boolean)
  .join('\n')
  .trim(),
)

const error = ref<string | null>(null)
const submitting = computed(() => ALL_PLATFORMS.some(p => platformState[p].status === 'publishing'))

function addPost () {
  posts.value.push({ text: '', mentions: [] })
}

function removePost (i: number) {
  if (posts.value.length === 1) return
  posts.value.splice(i, 1)
}

// Recompute the strong-ref `mentions` array from the `@<rkey>`
// placeholders in `text`. Skipped entries silently drop mentions of
// entities that have since been deleted.
function syncMentions (post: DraftPost) {
  const ids = new Set<string>()
  for (const match of post.text.matchAll(/@([a-z0-9]{13})\b/g)) {
    ids.add(match[1]!)
  }
  post.mentions = Array.from(ids).flatMap(rkey => {
    const ent = (entities.value ?? []).find(e => e.rkey === rkey)
    return ent ? [{ uri: ent.uri, cid: ent.cid }] : []
  })
}

type PostEditorRef = {
  insertMention: (entity: EntityEntry) => void
  insertLink: (label: string, url: string) => void
}
const editorRefs = ref<Array<PostEditorRef | null>>([])
function setEditorRef (i: number, el: unknown) {
  editorRefs.value[i] = el as PostEditorRef | null
}

function promptInsertLink (i: number) {
  const editor = editorRefs.value[i]
  if (!editor) return
  const label = window.prompt('Link text:')?.trim()
  if (!label) return
  const url = window.prompt('URL:')?.trim()
  if (!url) return
  editor.insertLink(label, url)
}

function onPickMention (i: number, target: HTMLSelectElement) {
  const ent = (entities.value ?? []).find(e => e.rkey === target.value)
  if (ent) editorRefs.value[i]?.insertMention(ent)
  target.value = ''
}

// Live Bluesky-equivalent character count, swapping each `@<rkey>`
// placeholder for a `@<handle>` estimate.
function blueskyLength (post: DraftPost, includeFooter: boolean): number {
  let len = post.text.length
  for (const match of post.text.matchAll(/@([a-z0-9]{13})\b/g)) {
    const ent = (entities.value ?? []).find(e => e.rkey === match[1])
    const handle = ent?.value.socialHandles?.bluesky ?? ''
    len = len - match[0].length + (handle ? handle.length + 1 : 0)
  }
  if (includeFooter) len += FOOTER_PREVIEW_LENGTH
  return len
}

// Upload the pending image to the PDS lazily, caching both the BlobRef
// and the in-flight promise so parallel publishes share a single upload.
const uploadedImage = ref<unknown>(null)
let uploadingPromise: Promise<unknown> | null = null
async function ensureImageUploaded (): Promise<unknown> {
  if (uploadedImage.value) return uploadedImage.value
  if (!pendingImage.value) return undefined
  if (uploadingPromise) return uploadingPromise

  const blob = pendingImage.value.blob
  uploadingPromise = (async () => {
    const buf = new Uint8Array(await blob.arrayBuffer())
    const result = await $fetch<unknown>('/api/admin/blobs', {
      method: 'POST',
      body: buf,
      headers: { 'content-type': blob.type || 'image/png' },
    })
    uploadedImage.value = result
    return result
  })()
  try {
    return await uploadingPromise
  }
  finally {
    uploadingPromise = null
  }
}

// Reset the cached upload when the user regenerates the image, so the
// next publish doesn't reuse a stale BlobRef.
watch(pendingImage, () => {
  uploadedImage.value = null
  uploadingPromise = null
})

function requirePosts (): boolean {
  if (posts.value.some(p => p.text.trim())) return true
  error.value = 'At least one post must have content.'
  return false
}

async function publishToPlatform (platform: AmaPlatform, force = false) {
  if (platformState[platform].status === 'publishing') return
  if (!requirePosts()) return
  error.value = null
  platformState[platform] = { status: 'publishing' }

  try {
    const image = await ensureImageUploaded()
    const baseBody = {
      question: props.question,
      posts: posts.value
        .filter(p => p.text.trim())
        .map(p => ({ text: p.text, mentions: p.mentions })),
      platforms,
      ...(image && pendingImage.value
        ? {
            image,
            imageDimensions: { width: pendingImage.value.width, height: pendingImage.value.height },
            backgroundStyle: pendingImage.value.backgroundStyleId,
          }
        : {}),
      ...(force ? { force: true } : {}),
    }

    const res = platform === 'youtubeShorts'
      ? await publishYouTube(baseBody)
      : await $fetch<{ success: boolean, url: string }>(
          `/api/admin/ama/${props.rkey}/publish/${platform}`,
          { method: 'POST', body: baseBody },
        )
    platformState[platform] = { status: 'success', url: res.url }
  }
  catch (err) {
    const data = (err as { data?: { statusMessage?: string } }).data
    platformState[platform] = {
      status: 'failed',
      error: data?.statusMessage || (err instanceof Error ? err.message : String(err)),
    }
  }
}

async function publishYouTube (baseBody: object): Promise<{ success: boolean, url: string }> {
  if (!pendingVideo.value) throw new Error('Generate a video before publishing to YouTube Shorts.')
  const form = new FormData()
  form.append('payload', new Blob([JSON.stringify({ ...baseBody, answer: plainAnswerForVideo.value })], { type: 'application/json' }))
  form.append('video', pendingVideo.value.blob, 'ama.webm')
  return $fetch<{ success: boolean, url: string }>(
    `/api/admin/ama/${props.rkey}/publish/youtube-shorts`,
    { method: 'POST', body: form },
  )
}

async function publishAll () {
  if (!requirePosts()) return
  error.value = null
  // Skip platforms that are unchecked, already published this session, or
  // (YouTube only) lack a generated video.
  const todo = ALL_PLATFORMS.filter(p =>
    platforms[p]
    && platformState[p].status !== 'success'
    && !(p === 'youtubeShorts' && !pendingVideo.value),
  )
  await Promise.all(todo.map(p => publishToPlatform(p)))
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <section class="bg-accent p-3">
      <h2 class="text-sm text-muted mb-1">
        Question
      </h2>
      <p class="whitespace-pre-wrap">
        {{ question }}
      </p>
    </section>

    <p
      v-if="error"
      class="text-sm text-red-500"
    >
      {{ error }}
    </p>

    <section class="flex flex-col gap-4">
      <div
        v-for="(post, i) in posts"
        :key="i"
        class="flex flex-col gap-2"
      >
        <header class="flex items-center justify-between text-xs text-muted">
          <span>Post {{ i + 1 }}{{ i === posts.length - 1 ? ' (+ footer)' : '' }}</span>
          <button
            v-if="posts.length > 1"
            type="button"
            class="hover:text-red-500"
            @click="removePost(i)"
          >
            Remove
          </button>
        </header>
        <AdminPostEditor
          :ref="(el) => setEditorRef(i, el)"
          :model-value="post.text"
          :entities="entities ?? []"
          :placeholder="i === 0 ? 'Your response…' : 'Continued…'"
          @update:model-value="(v) => { post.text = v; syncMentions(post) }"
        />
        <div class="flex items-center gap-3 text-xs">
          <select
            class="bg-accent px-2 py-1"
            @change="(e) => onPickMention(i, e.target as HTMLSelectElement)"
          >
            <option value="">
              Insert mention…
            </option>
            <option
              v-for="ent in entities ?? []"
              :key="ent.rkey"
              :value="ent.rkey"
            >
              @{{ ent.value.name }}
            </option>
          </select>
          <button
            type="button"
            class="bg-accent px-2 py-1 hover:bg-accent/70 text-muted"
            @click="promptInsertLink(i)"
          >
            Insert link
          </button>
          <span
            :class="{
              'text-red-500': blueskyLength(post, i === posts.length - 1) > BLUESKY_LIMIT,
              'text-yellow-500': blueskyLength(post, i === posts.length - 1) > BLUESKY_LIMIT - 30 && blueskyLength(post, i === posts.length - 1) <= BLUESKY_LIMIT,
            }"
            class="text-muted"
          >
            {{ blueskyLength(post, i === posts.length - 1) }} / {{ BLUESKY_LIMIT }} (bluesky)
          </span>
        </div>
      </div>

      <button
        type="button"
        class="text-sm text-muted hover:text-primary self-start"
        @click="addPost"
      >
        + Add post
      </button>
    </section>

    <AdminAmaImageGenerator
      :question="question"
      :created-at="createdAt"
      :initial-preview-url="initialImagePreviewUrl"
      :initial-background-style-id="initialBackgroundStyleId"
      @generated="pendingImage = $event"
      @cleared="pendingImage = null"
    />

    <AdminAmaVideoGenerator
      v-if="platforms.youtubeShorts"
      :question="question"
      :answer="plainAnswerForVideo"
      :background-style-id="pendingImage?.backgroundStyleId ?? initialBackgroundStyleId"
      @generated="pendingVideo = $event"
      @cleared="pendingVideo = null"
    />

    <section class="flex flex-col gap-3 text-sm">
      <h3 class="text-muted">
        Publish
      </h3>
      <ul class="flex flex-col divide-y divide-accent">
        <li
          v-for="platform in ALL_PLATFORMS"
          :key="platform"
          class="flex items-center gap-3 py-2"
        >
          <label class="flex items-center gap-2 min-w-32">
            <input
              v-model="platforms[platform]"
              type="checkbox"
            >
            <span class="capitalize">{{ platform === 'youtubeShorts' ? 'YouTube Shorts' : platform }}</span>
          </label>

          <div class="flex-grow min-w-0 text-xs">
            <a
              v-if="platformState[platform].url"
              :href="platformState[platform].url"
              target="_blank"
              rel="noopener"
              class="text-muted hover:text-primary underline-offset-4 hover:underline truncate block"
            >{{ platformState[platform].url }}</a>
            <span
              v-if="platformState[platform].error"
              class="text-red-500 block truncate"
            >{{ platformState[platform].error }}</span>
            <span
              v-else-if="platform === 'youtubeShorts' && platforms.youtubeShorts && !pendingVideo && platformState[platform].status !== 'success'"
              class="text-muted block"
            >Generate a video first.</span>
          </div>

          <button
            v-if="platformState[platform].status === 'success'"
            type="button"
            :disabled="submitting || (platform === 'youtubeShorts' && !pendingVideo)"
            class="text-xs text-muted hover:text-red-500 transition-colors disabled:opacity-60"
            @click="publishToPlatform(platform, true)"
          >
            Re-publish
          </button>
          <button
            v-else-if="platformState[platform].status === 'failed'"
            type="button"
            :disabled="submitting || !platforms[platform] || (platform === 'youtubeShorts' && !pendingVideo)"
            class="text-xs bg-accent text-primary px-3 py-1 hover:bg-accent/70 transition-colors disabled:opacity-60"
            @click="publishToPlatform(platform)"
          >
            Retry
          </button>
          <button
            v-else-if="platformState[platform].status === 'publishing'"
            type="button"
            disabled
            class="text-xs bg-accent text-muted px-3 py-1 opacity-60"
          >
            Publishing…
          </button>
          <button
            v-else
            type="button"
            :disabled="submitting || !platforms[platform] || (platform === 'youtubeShorts' && !pendingVideo)"
            class="text-xs bg-primary text-background px-3 py-1 hover:bg-primary/90 transition-colors disabled:opacity-60"
            @click="publishToPlatform(platform)"
          >
            Publish
          </button>
        </li>
      </ul>
    </section>

    <div class="flex gap-3">
      <button
        type="button"
        :disabled="submitting"
        class="bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
        @click="publishAll"
      >
        {{ submitting ? 'Publishing…' : 'Publish all enabled' }}
      </button>
      <NuxtLink
        to="/admin/ama"
        class="text-muted hover:text-primary self-center text-sm"
      >
        Back
      </NuxtLink>
    </div>
  </div>
</template>
