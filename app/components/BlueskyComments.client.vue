<script setup lang="ts">
import type { AppBskyFeedDefs, AppBskyRichtextFacet, AppBskyEmbedImages, AppBskyEmbedExternal } from '@atproto/api'

const props = defineProps<{
  uri: string
}>()

type Facet = AppBskyRichtextFacet.Main
type ThreadViewPost = AppBskyFeedDefs.ThreadViewPost

interface CommentEmbed {
  type: 'images' | 'external'
  images?: AppBskyEmbedImages.ViewImage[]
  external?: AppBskyEmbedExternal.ViewExternal
}

interface Comment {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  text: string
  facets?: Facet[]
  embed?: CommentEmbed
  createdAt: string
  likeCount: number
  replyCount: number
  repostCount: number
  replies: Comment[]
}

function isThreadViewPost (v: unknown): v is ThreadViewPost {
  return (
    typeof v === 'object'
    && v !== null
    && '$type' in v
    && v.$type === 'app.bsky.feed.defs#threadViewPost'
  )
}

function parseEmbed (embed: unknown): CommentEmbed | undefined {
  if (!embed || typeof embed !== 'object') return undefined

  const e = embed as Record<string, unknown>

  if (e.$type === 'app.bsky.embed.images#view' && Array.isArray(e.images)) {
    return {
      type: 'images',
      images: e.images as AppBskyEmbedImages.ViewImage[],
    }
  }

  if (e.$type === 'app.bsky.embed.external#view' && e.external) {
    return {
      type: 'external',
      external: e.external as AppBskyEmbedExternal.ViewExternal,
    }
  }

  return undefined
}

function parseThread (thread: ThreadViewPost): Comment | null {
  if (!isThreadViewPost(thread)) return null

  const post = thread.post
  const record = post.record as { text: string, createdAt: string, facets?: Facet[] }

  const replies: Comment[] = []
  if (thread.replies) {
    for (const reply of thread.replies) {
      if (isThreadViewPost(reply)) {
        const parsed = parseThread(reply)
        if (parsed) replies.push(parsed)
      }
    }
    // Sort replies by date ascending (oldest first)
    replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  return {
    uri: post.uri,
    cid: post.cid,
    author: {
      did: post.author.did,
      handle: post.author.handle,
      displayName: post.author.displayName,
      avatar: post.author.avatar,
    },
    text: record.text as string,
    createdAt: record.createdAt as string,
    facets: record.facets,
    embed: parseEmbed(post.embed),
    likeCount: post.likeCount ?? 0,
    replyCount: post.replyCount ?? 0,
    repostCount: post.repostCount ?? 0,
    replies,
  }
}

const { data: thread, pending, error } = useFetch(() =>
  `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread`, {
  query: { uri: props.uri, depth: 10 },
  key: props.uri,
  lazy: true,
  server: false,
  transform: (response: { thread: ThreadViewPost }) => parseThread(response.thread),
})

const postUrl = computed(() => {
  // Convert AT URI to bsky.app URL
  // at://did:plc:xxx/app.bsky.feed.post/rkey -> https://bsky.app/profile/did:plc:xxx/post/rkey
  const match = props.uri.match(/at:\/\/([^/]+)\/app\.bsky\.feed\.post\/(.+)/)
  if (match) {
    const [, did, rkey] = match
    return `https://bsky.app/profile/${did}/post/${rkey}`
  }
  return null
})
</script>

<template>
  <div class="mt-12">
    <hr class="block mx-auto my-8 content w-4 border-t-2 border-solid border-gray-300 dark:border-gray-700">
    <h2 class="text-xl mb-4">
      Comments
    </h2>

    <div
      v-if="pending"
      class="flex items-center justify-center w-[2rem]"
    >
      <span
        class="h-6 w-6 i-svg-spinners:90-ring-with-bg"
        aria-hidden="true"
      />
      <span class="sr-only">Loading comments</span>
    </div>

    <div v-else-if="error">
      <p class="text-muted">
        Could not load comments.
        <a
          v-if="postUrl"
          :href="postUrl"
          target="_blank"
          rel="noopener"
          class="underline"
        >
          View on Bluesky
        </a>
      </p>
    </div>

    <div v-else-if="!thread || thread.replies.length === 0">
      <p class="text-muted mb-4">
        No comments yet.
      </p>
      <a
        v-if="postUrl"
        :href="postUrl"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 text-sm underline"
      >
        Reply on Bluesky
      </a>
    </div>

    <div
      v-else
      class="flex flex-col gap-6"
    >
      <div class="flex items-center gap-4 text-sm text-muted">
        <span>{{ thread.replyCount }} {{ thread.replyCount === 1 ? 'reply' : 'replies' }}</span>
        <span>{{ thread.likeCount }} {{ thread.likeCount === 1 ? 'like' : 'likes' }}</span>
        <a
          v-if="postUrl"
          :href="postUrl"
          target="_blank"
          rel="noopener"
          class="underline ml-auto"
        >
          Reply on Bluesky
        </a>
      </div>

      <BlueskyComment
        v-for="reply in thread.replies"
        :key="reply.uri"
        :comment="reply"
        :depth="0"
      />
    </div>
  </div>
</template>
