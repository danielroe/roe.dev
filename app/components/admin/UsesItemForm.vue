<script setup lang="ts">
import { community } from '#shared/lex'
import type { com, dev } from '#shared/lex'
import { ref } from 'vue'
import { COMMUNITY_IMAGE_MAX_BYTES, blobUrlFor, cidFromBlob } from '#shared/cms/blob'
import type { Loose, Strict } from '#shared/cms/strict'

type UsesItemValue = Omit<Loose<Strict<dev.roe.usesItem.Main>>, '$type'>

interface UsesCategoryEntry {
  rkey: string
  uri: string
  cid: string
  value: dev.roe.usesCategory.Main
}

const props = defineProps<{
  initial?: Partial<UsesItemValue>
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', value: UsesItemValue): void
}>()

const { data: categories } = useAdminFetch<UsesCategoryEntry[]>('/api/admin/uses-categories', { default: () => [] })

const { defs } = community.lexicon.app

const LINK_ROLES = [
  { value: '', label: 'No role' },
  { value: defs.linkRoleWebsite.value, label: 'Website' },
  { value: defs.linkRoleSourceCode.value, label: 'Source code' },
  { value: defs.linkRoleDocs.value, label: 'Docs' },
  { value: defs.linkRoleSupport.value, label: 'Support' },
]

const { public: publicConfig } = useRuntimeConfig()
const pdsService = publicConfig.atproto?.service || null
const pdsDid = publicConfig.atproto?.did || null

const form = reactive({
  categoryUri: props.initial?.category?.uri ?? '',
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
  order: props.initial?.order ?? 100,
  image: props.initial?.image?.image,
  imageAlt: props.initial?.image?.alt ?? '',
  aspectRatio: props.initial?.image?.aspectRatio,
  links: (props.initial?.links ?? []).map(l => ({ uri: l.uri, label: l.label ?? '', role: l.role ?? '' })),
})

const localPreviewUrl = ref<string | null>(null)
onBeforeUnmount(() => {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
})

const submitting = ref(false)
const error = ref<string | null>(null)

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

  if (file.size > COMMUNITY_IMAGE_MAX_BYTES) {
    error.value = `That image is ${(file.size / 1_000_000).toFixed(1)} MB; the record format allows 2 MB.`
    return
  }

  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = URL.createObjectURL(file)

  const buf = new Uint8Array(await file.arrayBuffer())
  try {
    const [uploaded, clientAspectRatio] = await Promise.all([
      $fetch<{
        blob: NonNullable<NonNullable<UsesItemValue['image']>['image']>
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
    if (!form.imageAlt && form.name) form.imageAlt = form.name
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
  form.imageAlt = ''
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = null
  }
}

function addLink () {
  form.links.push({ uri: '', label: '', role: '' })
}

function removeLink (i: number) {
  form.links.splice(i, 1)
}

async function onSubmit () {
  error.value = null
  submitting.value = true
  try {
    const category = (categories.value ?? []).find(c => c.uri === form.categoryUri)
    if (!category) {
      error.value = 'Please pick a category.'
      submitting.value = false
      return
    }
    const categoryRef: Loose<com.atproto.repo.strongRef.Main> = { uri: category.uri, cid: category.cid }

    if (form.image && !form.imageAlt) {
      error.value = 'Please describe the image for screen reader users.'
      submitting.value = false
      return
    }

    const links = form.links
      .filter(l => l.uri)
      .map(l => ({
        $type: 'community.lexicon.app.defs#link' as const,
        uri: l.uri,
        ...(l.label ? { label: l.label } : {}),
        ...(l.role ? { role: l.role } : {}),
      }))

    const value: UsesItemValue = {
      category: categoryRef,
      name: form.name,
      ...(form.description ? { description: form.description } : {}),
      order: form.order,
      ...(form.image
        ? {
            image: {
              $type: 'community.lexicon.app.defs#image' as const,
              image: form.image,
              alt: form.imageAlt,
              ...(form.aspectRatio ? { aspectRatio: form.aspectRatio } : {}),
            },
          }
        : {}),
      ...(links.length ? { links } : {}),
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
    class="flex flex-col gap-4 max-w-2xl"
    @submit.prevent="onSubmit"
  >
    <p
      v-if="error"
      class="text-sm text-red-500"
    >
      {{ error }}
    </p>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Category <span class="text-red-500">*</span></span>
      <select
        v-model="form.categoryUri"
        required
        class="bg-accent px-3 py-2"
      >
        <option value="">
          - pick a category -
        </option>
        <option
          v-for="c in categories ?? []"
          :key="c.uri"
          :value="c.uri"
        >
          {{ c.value.title }}
        </option>
      </select>
    </label>

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Name <span class="text-red-500">*</span></span>
      <input
        v-model="form.name"
        required
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

    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted">Order</span>
      <input
        v-model.number="form.order"
        type="number"
        class="bg-accent px-3 py-2"
      >
      <span class="text-xs text-muted">Lower numbers render first within a category. Defaults to 100.</span>
    </label>

    <div class="flex flex-col gap-2 text-sm">
      <span class="text-muted">Links</span>
      <div
        v-for="(link, i) in form.links"
        :key="i"
        class="flex gap-2 items-center"
      >
        <input
          v-model="form.links[i]!.uri"
          type="url"
          placeholder="https://…"
          class="bg-accent px-3 py-2 flex-grow"
          :aria-label="`Link ${i + 1} URL`"
        >
        <input
          v-model="form.links[i]!.label"
          type="text"
          placeholder="Label (optional)"
          class="bg-accent px-3 py-2 w-32"
          :aria-label="`Link ${i + 1} label`"
        >
        <select
          v-model="form.links[i]!.role"
          class="bg-accent px-3 py-2 w-32"
          :aria-label="`Link ${i + 1} role`"
        >
          <option
            v-for="role in LINK_ROLES"
            :key="role.value"
            :value="role.value"
          >
            {{ role.label }}
          </option>
        </select>
        <button
          type="button"
          class="text-xs text-muted hover:text-red-500"
          @click="removeLink(i)"
        >
          Remove
        </button>
      </div>
      <button
        type="button"
        class="text-xs text-muted hover:text-primary self-start"
        @click="addLink"
      >
        + Add link
      </button>
    </div>

    <div class="flex flex-col gap-2 text-sm">
      <label class="flex flex-col gap-2">
        <span class="text-muted">Image</span>
        <input
          type="file"
          accept="image/*"
          class="text-sm"
          @change="onImageChange"
        >
      </label>
      <div
        v-if="imageUrl"
        class="flex items-start gap-3"
      >
        <img
          :src="imageUrl"
          alt="Item image preview"
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
      <label
        v-if="form.image"
        class="flex flex-col gap-1"
      >
        <span class="text-muted">Alt text <span class="text-red-500">*</span></span>
        <input
          v-model="form.imageAlt"
          type="text"
          required
          class="bg-accent px-3 py-2"
        >
      </label>
    </div>

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="submitting"
        class="bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {{ submitting ? 'Saving…' : (submitLabel ?? 'Save') }}
      </button>
      <NuxtLink
        to="/admin/uses"
        class="text-muted hover:text-primary self-center text-sm"
      >
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>
