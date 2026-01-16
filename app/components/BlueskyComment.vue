<script setup lang="ts">
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
  createdAt: string
  likeCount: number
  replyCount: number
  repostCount: number
  replies: Comment[]
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
      <NuxtImg
        v-if="comment.author.avatar"
        :src="comment.author.avatar"
        :alt="comment.author.displayName || comment.author.handle"
        class="rounded-full h-10 w-10"
        width="40"
        height="40"
        loading="lazy"
      />
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
        {{ comment.text }}
      </p>

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
        <NuxtImg
          v-if="comment.author.avatar"
          :src="comment.author.avatar"
          :alt="comment.author.displayName || comment.author.handle"
          class="rounded-full h-5 w-5"
          width="20"
          height="20"
          loading="lazy"
        />
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
      {{ comment.text }}
    </p>

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
