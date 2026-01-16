<script setup lang="ts">
import type {
  AppBskyRichtextFacet,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
} from '@atproto/api'

type Facet = AppBskyRichtextFacet.Main

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

// Rich text segment for rendering
interface TextSegment {
  text: string
  type: 'text' | 'link' | 'mention' | 'tag'
  url?: string
}

function parseRichText (text: string, facets?: Facet[]): TextSegment[] {
  if (!facets || facets.length === 0) {
    return [{ text, type: 'text' }]
  }

  // Convert string to bytes for proper indexing (Bluesky uses byte offsets)
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const bytes = encoder.encode(text)

  // Sort facets by start index
  const sortedFacets = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart)

  const segments: TextSegment[] = []
  let lastEnd = 0

  for (const facet of sortedFacets) {
    const { byteStart, byteEnd } = facet.index

    // Add plain text before this facet
    if (byteStart > lastEnd) {
      segments.push({
        text: decoder.decode(bytes.slice(lastEnd, byteStart)),
        type: 'text',
      })
    }

    const facetText = decoder.decode(bytes.slice(byteStart, byteEnd))
    const feature = facet.features[0] as
      | { $type: 'app.bsky.richtext.facet#link', uri: string }
      | { $type: 'app.bsky.richtext.facet#mention', did: string }
      | { $type: 'app.bsky.richtext.facet#tag', tag: string }
      | undefined

    if (feature?.$type === 'app.bsky.richtext.facet#link') {
      segments.push({
        text: facetText,
        type: 'link',
        url: feature.uri,
      })
    }
    else if (feature?.$type === 'app.bsky.richtext.facet#mention') {
      segments.push({
        text: facetText,
        type: 'mention',
        url: `https://bsky.app/profile/${feature.did}`,
      })
    }
    else if (feature?.$type === 'app.bsky.richtext.facet#tag') {
      segments.push({
        text: facetText,
        type: 'tag',
        url: `https://bsky.app/hashtag/${feature.tag}`,
      })
    }
    else {
      segments.push({ text: facetText, type: 'text' })
    }

    lastEnd = byteEnd
  }

  // Add remaining text after last facet
  if (lastEnd < bytes.length) {
    segments.push({
      text: decoder.decode(bytes.slice(lastEnd)),
      type: 'text',
    })
  }

  return segments
}

function getCommentUrl (comment: Comment): string {
  const match = comment.uri.match(/at:\/\/([^/]+)\/app\.bsky\.feed\.post\/(.+)/)
  if (match) {
    const [, did, rkey] = match
    return `https://bsky.app/profile/${did}/post/${rkey}`
  }
  return '#'
}

const props = defineProps<{
  comment: Comment
  depth: number
}>()

const commentUrl = computed(() => getCommentUrl(props.comment))
const richText = computed(() => parseRichText(props.comment.text, props.comment.facets))
const maxDepth = 4
</script>

<template>
  <div
    v-if="depth === 0"
    class="flex gap-3"
  >
    <a
      :href="`https://bsky.app/profile/${comment.author.handle}`"
      target="_blank"
      rel="noopener"
      class="flex-shrink-0"
    >
      <img
        v-if="comment.author.avatar"
        :src="comment.author.avatar"
        :alt="comment.author.displayName || comment.author.handle"
        class="rounded-full h-10 w-10"
        width="40"
        height="40"
        loading="lazy"
      >
      <div
        v-else
        class="rounded-full h-10 w-10 bg-gray-700 flex items-center justify-center text-sm"
      >
        {{ (comment.author.displayName || comment.author.handle).charAt(0).toUpperCase() }}
      </div>
    </a>

    <div class="flex-1 min-w-0">
      <div class="flex items-baseline gap-2 flex-wrap">
        <a
          :href="`https://bsky.app/profile/${comment.author.handle}`"
          target="_blank"
          rel="noopener"
          class="font-medium hover:underline truncate"
        >
          {{ comment.author.displayName || `@${comment.author.handle}` }}
        </a>
        <span
          v-if="comment.author.displayName"
          class="text-gray-500 text-sm truncate"
        >
          @{{ comment.author.handle }}
        </span>
        <a
          :href="commentUrl"
          target="_blank"
          rel="noopener"
          class="text-gray-500 text-sm hover:underline"
        >
          <NuxtTime
            relative
            :datetime="comment.createdAt"
          />
        </a>
      </div>

      <p class="mt-1 whitespace-pre-wrap break-words">
        <template
          v-for="(segment, i) in richText"
          :key="i"
        >
          <a
            v-if="segment.type === 'link' || segment.type === 'mention' || segment.type === 'tag'"
            :href="segment.url"
            target="_blank"
            rel="noopener"
            class="text-blue-400 hover:underline"
          >{{ segment.text }}</a>
          <template v-else>
            {{ segment.text }}
          </template>
        </template>
      </p>

      <div
        v-if="comment.embed?.type === 'images' && comment.embed.images"
        class="mt-2 flex gap-2 flex-wrap"
      >
        <a
          v-for="(img, i) in comment.embed.images"
          :key="i"
          :href="img.fullsize"
          target="_blank"
          rel="noopener"
          class="block"
        >
          <img
            :src="img.thumb"
            :alt="img.alt || 'Image'"
            class="rounded-lg max-h-48 object-cover"
            loading="lazy"
          >
        </a>
      </div>

      <a
        v-if="comment.embed?.type === 'external' && comment.embed.external"
        :href="comment.embed.external.uri"
        target="_blank"
        rel="noopener"
        class="mt-2 block border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
      >
        <div class="flex">
          <img
            v-if="comment.embed.external.thumb"
            :src="comment.embed.external.thumb"
            :alt="comment.embed.external.title"
            class="w-24 h-24 object-cover flex-shrink-0"
            loading="lazy"
          >
          <div class="p-3 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ comment.embed.external.title }}
            </p>
            <p class="text-xs text-gray-500 line-clamp-2 mt-1">
              {{ comment.embed.external.description }}
            </p>
          </div>
        </div>
      </a>

      <div
        v-if="comment.likeCount > 0 || comment.repostCount > 0"
        class="flex items-center gap-4 mt-2 text-sm text-gray-500"
      >
        <span v-if="comment.likeCount > 0">
          {{ comment.likeCount }} {{ comment.likeCount === 1 ? 'like' : 'likes' }}
        </span>
        <span v-if="comment.repostCount > 0">
          {{ comment.repostCount }} {{ comment.repostCount === 1 ? 'repost' : 'reposts' }}
        </span>
      </div>

      <div
        v-if="comment.replies.length > 0"
        class="mt-4 flex flex-col gap-4 border-l border-gray-800"
      >
        <BlueskyComment
          v-for="reply in comment.replies"
          :key="reply.uri"
          :comment="reply"
          :depth="depth + 1"
        />
      </div>
    </div>
  </div>

  <div
    v-else
    class="pt-3 pl-1"
  >
    <div class="flex items-center gap-2 flex-wrap">
      <a
        :href="`https://bsky.app/profile/${comment.author.handle}`"
        target="_blank"
        rel="noopener"
        class="flex-shrink-0"
      >
        <img
          v-if="comment.author.avatar"
          :src="comment.author.avatar"
          :alt="comment.author.displayName || comment.author.handle"
          class="rounded-full h-5 w-5"
          width="20"
          height="20"
          loading="lazy"
        >
        <div
          v-else
          class="rounded-full h-5 w-5 bg-gray-700 flex items-center justify-center text-xs"
        >
          {{ (comment.author.displayName || comment.author.handle).charAt(0).toUpperCase() }}
        </div>
      </a>
      <a
        :href="`https://bsky.app/profile/${comment.author.handle}`"
        target="_blank"
        rel="noopener"
        class="font-medium hover:underline truncate"
      >
        {{ comment.author.displayName || `@${comment.author.handle}` }}
      </a>
      <span
        v-if="comment.author.displayName"
        class="text-gray-500 text-sm truncate"
      >
        @{{ comment.author.handle }}
      </span>
      <a
        :href="commentUrl"
        target="_blank"
        rel="noopener"
        class="text-gray-500 text-sm hover:underline"
      >
        <NuxtTime
          relative
          :datetime="comment.createdAt"
        />
      </a>
    </div>

    <p class="mt-1 whitespace-pre-wrap break-words">
      <template
        v-for="(segment, i) in richText"
        :key="i"
      >
        <a
          v-if="segment.type === 'link' || segment.type === 'mention' || segment.type === 'tag'"
          :href="segment.url"
          target="_blank"
          rel="noopener"
          class="text-blue-400 hover:underline"
        >{{ segment.text }}</a>
        <template v-else>
          {{ segment.text }}
        </template>
      </template>
    </p>

    <div
      v-if="comment.embed?.type === 'images' && comment.embed.images"
      class="mt-2 flex gap-2 flex-wrap"
    >
      <a
        v-for="(img, i) in comment.embed.images"
        :key="i"
        :href="img.fullsize"
        target="_blank"
        rel="noopener"
        class="block"
      >
        <img
          :src="img.thumb"
          :alt="img.alt || 'Image'"
          class="rounded-lg max-h-32 object-cover"
          loading="lazy"
        >
      </a>
    </div>

    <a
      v-if="comment.embed?.type === 'external' && comment.embed.external"
      :href="comment.embed.external.uri"
      target="_blank"
      rel="noopener"
      class="mt-2 block border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
    >
      <div class="flex">
        <img
          v-if="comment.embed.external.thumb"
          :src="comment.embed.external.thumb"
          :alt="comment.embed.external.title"
          class="w-20 h-20 object-cover flex-shrink-0"
          loading="lazy"
        >
        <div class="p-2 min-w-0">
          <p class="text-sm font-medium truncate">
            {{ comment.embed.external.title }}
          </p>
          <p class="text-xs text-gray-500 line-clamp-2 mt-1">
            {{ comment.embed.external.description }}
          </p>
        </div>
      </div>
    </a>

    <template v-if="comment.replies.length > 0">
      <div
        v-if="depth < maxDepth"
        class="flex flex-col border-l border-gray-800"
      >
        <BlueskyComment
          v-for="reply in comment.replies"
          :key="reply.uri"
          :comment="reply"
          :depth="depth + 1"
        />
      </div>
      <a
        v-else
        :href="getCommentUrl(comment.replies[0]!)"
        target="_blank"
        rel="noopener"
        class="text-sm text-gray-500 hover:underline mt-2 block"
      >
        {{ comment.replies.length }} more {{ comment.replies.length === 1 ? 'reply' : 'replies' }}...
      </a>
    </template>
  </div>
</template>
