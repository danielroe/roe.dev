<script setup lang="ts">
import type { DevRoeTalk, DevRoeTalkGroup, ComAtprotoRepoStrongRef } from '#shared/lex'
import { ref } from 'vue'
import { blobUrlFor, cidFromBlob } from '#shared/cms/blob'
import type { Strict } from '#shared/cms/strict'

type TalkValue = Omit<Strict<DevRoeTalk.Record>, '$type'>

interface TalkGroupEntry {
  rkey: string
  uri: string
  cid: string
  value: DevRoeTalkGroup.Record
}

interface GitHubRelease {
  tag: string
  name: string
  publishedAt: string | null
}

const props = defineProps<{
  initial?: Partial<TalkValue>
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', value: TalkValue): void
}>()

const { data: groups } = useFetch<TalkGroupEntry[]>('/api/admin/talk-groups', { default: () => [] })
const { data: releases } = useFetch<GitHubRelease[]>('/api/admin/github-releases', { default: () => [] })

const { public: publicConfig } = useRuntimeConfig()
const pdsService = publicConfig.atproto?.service || null
const pdsDid = publicConfig.atproto?.did || null

const TYPES = ['conference', 'meetup', 'podcast', 'workshop', 'stream', 'talk'] as const

const form = reactive({
  title: props.initial?.title ?? '',
  description: props.initial?.description ?? '',
  date: toDateInput(props.initial?.date) ?? '',
  endDate: toDateInput(props.initial?.endDate) ?? '',
  source: props.initial?.source ?? '',
  location: props.initial?.location ?? '',
  type: (props.initial?.type as typeof TYPES[number]) ?? 'conference',
  tags: (props.initial?.tags ?? []).join(', '),
  link: props.initial?.link ?? '',
  video: props.initial?.video ?? '',
  slides: props.initial?.slides ?? '',
  demo: props.initial?.demo ?? '',
  repo: props.initial?.repo ?? '',
  groupUri: props.initial?.group?.uri ?? '',
  image: props.initial?.image,
  aspectRatio: props.initial?.aspectRatio,
})

/**
 * Local object URL for a just-uploaded image, so the user sees a preview
 * before the record is saved. Cleared when the underlying image changes or
 * the component unmounts.
 */
const localPreviewUrl = ref<string | null>(null)
onBeforeUnmount(() => {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
})

const submitting = ref(false)
const error = ref<string | null>(null)

function toDateInput (iso?: string): string | undefined {
  if (!iso) return undefined
  return iso.slice(0, 10)
}

const imageUrl = computed(() => {
  if (localPreviewUrl.value) return localPreviewUrl.value
  if (!form.image || !pdsService || !pdsDid) return null
  const cid = cidFromBlob(form.image)
  if (!cid) return null
  return blobUrlFor(pdsService, pdsDid, cid)
})

async function onImageChange (e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = URL.createObjectURL(file)

  const buf = new Uint8Array(await file.arrayBuffer())
  try {
    const [uploaded, clientAspectRatio] = await Promise.all([
      $fetch<{
        blob: NonNullable<TalkValue['image']>
        aspectRatio?: { width: number, height: number }
      }>('/api/admin/blobs', {
        method: 'POST',
        body: buf,
        headers: { 'content-type': file.type || 'application/octet-stream' },
      }),
      probeImageAspectRatio(file),
    ])
    form.image = uploaded.blob
    form.aspectRatio = clientAspectRatio ?? uploaded.aspectRatio
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    if (localPreviewUrl.value) {
      URL.revokeObjectURL(localPreviewUrl.value)
      localPreviewUrl.value = null
    }
  }
}

function clearImage () {
  form.image = undefined
  form.aspectRatio = undefined
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = null
  }
}

async function onSubmit () {
  error.value = null
  submitting.value = true
  try {
    const group = (groups.value ?? []).find(g => g.uri === form.groupUri)
    const groupRef: ComAtprotoRepoStrongRef.Main | undefined = group
      ? { uri: group.uri, cid: group.cid }
      : undefined

    const value: TalkValue = {
      ...(form.title ? { title: form.title } : {}),
      ...(form.description ? { description: form.description } : {}),
      date: new Date(form.date).toISOString(),
      ...(form.endDate ? { endDate: new Date(form.endDate).toISOString() } : {}),
      source: form.source,
      ...(form.location ? { location: form.location } : {}),
      type: form.type,
      ...(form.tags.trim() ? { tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) } : {}),
      ...(form.link ? { link: form.link } : {}),
      ...(form.video ? { video: form.video } : {}),
      ...(form.slides ? { slides: form.slides } : {}),
      ...(form.demo ? { demo: form.demo } : {}),
      ...(form.repo ? { repo: form.repo } : {}),
      ...(groupRef ? { group: groupRef } : {}),
      ...(form.image ? { image: form.image } : {}),
      ...(form.image && form.aspectRatio ? { aspectRatio: form.aspectRatio } : {}),
      ...(props.initial?.createdAt ? { createdAt: props.initial.createdAt } : { createdAt: new Date().toISOString() }),
    }

    emit('submit', value)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    @submit.prevent="onSubmit"
  >
    <p
      v-if="error"
      class="text-sm text-red-500"
    >
      {{ error }}
    </p>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Title</span>
      <input
        v-model="form.title"
        type="text"
        class="bg-accent px-3 py-2"
      >
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Description</span>
      <textarea
        v-model="form.description"
        rows="3"
        class="bg-accent px-3 py-2"
      />
    </label>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Date <span class="text-red-500">*</span></span>
        <input
          v-model="form.date"
          required
          type="date"
          class="bg-accent px-3 py-2"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">End date (multi-day)</span>
        <input
          v-model="form.endDate"
          type="date"
          class="bg-accent px-3 py-2"
        >
      </label>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Source / event <span class="text-red-500">*</span></span>
        <input
          v-model="form.source"
          required
          type="text"
          class="bg-accent px-3 py-2"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Location</span>
        <input
          v-model="form.location"
          type="text"
          class="bg-accent px-3 py-2"
        >
      </label>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Type <span class="text-red-500">*</span></span>
        <select
          v-model="form.type"
          required
          class="bg-accent px-3 py-2"
        >
          <option
            v-for="t in TYPES"
            :key="t"
            :value="t"
          >
            {{ t }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Group</span>
        <select
          v-model="form.groupUri"
          class="bg-accent px-3 py-2"
        >
          <option value="">
            - none -
          </option>
          <option
            v-for="g in groups ?? []"
            :key="g.uri"
            :value="g.uri"
          >
            {{ g.value.title }}
          </option>
        </select>
      </label>
    </div>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Tags (comma-separated)</span>
      <input
        v-model="form.tags"
        type="text"
        class="bg-accent px-3 py-2"
      >
    </label>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Event link</span>
        <input
          v-model="form.link"
          type="url"
          class="bg-accent px-3 py-2"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Video link</span>
        <input
          v-model="form.video"
          type="url"
          class="bg-accent px-3 py-2"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Slides (GitHub release tag)</span>
        <input
          v-model="form.slides"
          type="text"
          list="admin-slides-releases"
          class="bg-accent px-3 py-2"
        >
        <datalist id="admin-slides-releases">
          <option
            v-for="r in releases ?? []"
            :key="r.tag"
            :value="r.tag"
          >
            {{ r.name }}
          </option>
        </datalist>
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Demo link</span>
        <input
          v-model="form.demo"
          type="url"
          class="bg-accent px-3 py-2"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm md:col-span-2">
        <span class="text-muted">Repo link</span>
        <input
          v-model="form.repo"
          type="url"
          class="bg-accent px-3 py-2"
        >
      </label>
    </div>

    <label class="flex flex-col gap-2 text-sm">
      <span class="text-muted">Image</span>
      <div
        v-if="imageUrl"
        class="flex items-start gap-3"
      >
        <img
          :src="imageUrl"
          alt="Talk image preview"
          class="max-h-40 bg-accent object-contain"
        >
        <button
          type="button"
          class="text-xs text-muted hover:text-red-500 transition-colors"
          @click="clearImage"
        >
          Remove
        </button>
      </div>
      <input
        type="file"
        accept="image/*"
        class="text-sm"
        @change="onImageChange"
      >
    </label>

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="submitting"
        class="bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {{ submitting ? 'Saving…' : (submitLabel ?? 'Save') }}
      </button>
      <NuxtLink
        to="/admin/talks"
        class="text-muted hover:text-primary self-center text-sm"
      >
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>
