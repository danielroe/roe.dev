<script setup lang="ts">
import { domToBlob } from 'modern-screenshot'
import { BACKGROUND_STYLES, DEFAULT_BACKGROUND_STYLE_ID, getBackgroundStyle } from '#shared/cms/backgrounds'
import { getHumanRelativeDate } from '#shared/cms/date-formatting'
import { ref } from 'vue'

// The blob is held locally until publish time (unreferenced PDS blobs
// get GC'd, so we wait until the record write that anchors it).
export interface GeneratedImage {
  blob: Blob
  width: number
  height: number
  backgroundStyleId: string
}

const props = defineProps<{
  question: string
  createdAt: string
  /** Previously-generated image, if any (e.g. when editing an answered AMA). */
  initialPreviewUrl?: string | null
  initialBackgroundStyleId?: string
}>()

const emit = defineEmits<{
  (e: 'generated', value: GeneratedImage): void
  (e: 'cleared'): void
}>()

const backgroundStyleId = ref(props.initialBackgroundStyleId ?? DEFAULT_BACKGROUND_STYLE_ID)
const backgroundStyle = computed(() => getBackgroundStyle(backgroundStyleId.value))

const relativeDate = computed(() => getHumanRelativeDate(props.createdAt))
const formattedText = computed(() => props.question.trim())
const hasContent = computed(() => Boolean(formattedText.value))

const generating = ref(false)
const error = ref<string | null>(null)

const terminalRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)
const previewWrapperRef = ref<HTMLDivElement | null>(null)

// Scale the 1200px-wide terminal down to fit the wrapper. Capped at 1 so
// it doesn't up-scale on wide screens. `clientHeight` returns the
// pre-transform value, so we read it before applying the scale.
const previewScale = ref(0.4)
const previewWrapperHeight = ref<string>('auto')

function recalculatePreviewSize () {
  if (!previewWrapperRef.value || !terminalRef.value) return
  const wrapperWidth = previewWrapperRef.value.clientWidth || 480
  const scale = Math.min(1, wrapperWidth / 1200)
  previewScale.value = scale
  previewWrapperHeight.value = `${Math.ceil(terminalRef.value.clientHeight * scale)}px`
}

onMounted(() => {
  recalculatePreviewSize()
  if (typeof ResizeObserver !== 'undefined' && previewWrapperRef.value) {
    const ro = new ResizeObserver(() => recalculatePreviewSize())
    ro.observe(previewWrapperRef.value)
    onBeforeUnmount(() => ro.disconnect())
  }
})
const visualLineCount = ref(1)
watch([formattedText, backgroundStyleId, visualLineCount], () => nextTick(recalculatePreviewSize))

// Approximate the wrapped-line count by measuring rendered text into a
// hidden probe, so the line-number gutter sizes correctly.
function recalculateLineCount () {
  if (!formattedText.value) {
    visualLineCount.value = 1
    return
  }
  if (!contentRef.value) return
  const contentWidth = (contentRef.value.clientWidth || 960) - 40
  const probe = document.createElement('div')
  probe.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${contentWidth}px;
    font-family: JetBrains Mono, Monaco, monospace;
    font-size: 24px;
    line-height: 32px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    padding: 0;
    margin: 0;
  `
  probe.textContent = formattedText.value
  document.body.appendChild(probe)
  visualLineCount.value = Math.max(1, Math.ceil(probe.offsetHeight / 32))
  document.body.removeChild(probe)
}
watch([formattedText, backgroundStyleId], () => nextTick(recalculateLineCount), { immediate: true })
onMounted(recalculateLineCount)

const lineNumbers = computed(() => Array.from({ length: visualLineCount.value }, (_, i) => (i + 1).toString().padStart(2, ' ')))

// Object URL of the most recently generated blob (or the existing image
// passed in for an answered AMA). Cleared when the question or
// background changes so the user is prompted to regenerate.
const generatedUrl = ref<string | null>(props.initialPreviewUrl ?? null)
const lastSignature = ref<string | null>(props.initialPreviewUrl ? `${props.question}::${backgroundStyleId.value}` : null)

onBeforeUnmount(() => {
  if (generatedUrl.value?.startsWith('blob:')) URL.revokeObjectURL(generatedUrl.value)
})

watch([formattedText, backgroundStyleId], ([question, styleId]) => {
  const sig = `${question}::${styleId}`
  if (lastSignature.value && lastSignature.value !== sig) {
    if (generatedUrl.value?.startsWith('blob:')) URL.revokeObjectURL(generatedUrl.value)
    generatedUrl.value = null
    lastSignature.value = null
    emit('cleared')
  }
})

async function generate () {
  if (!hasContent.value || !terminalRef.value || generating.value) return
  generating.value = true
  error.value = null
  try {
    await nextTick()

    const node = terminalRef.value
    // Bluesky's `app.bsky.embed.images` rejects images larger than 2000px
    // on either axis; cap the capture scale (otherwise 2× retina).
    const BLUESKY_MAX = 2000
    const naturalWidth = node.clientWidth
    const naturalHeight = node.clientHeight
    const captureScale = Math.min(2, BLUESKY_MAX / naturalWidth, BLUESKY_MAX / naturalHeight)

    const blob = await domToBlob(node, {
      width: naturalWidth,
      height: naturalHeight,
      scale: captureScale,
      style: { transform: 'scale(1)', transformOrigin: 'top left' },
    })
    if (!blob) throw new Error('Image generation produced no blob.')

    const width = Math.round(naturalWidth * captureScale)
    const height = Math.round(naturalHeight * captureScale)

    if (generatedUrl.value?.startsWith('blob:')) URL.revokeObjectURL(generatedUrl.value)
    generatedUrl.value = URL.createObjectURL(blob)
    lastSignature.value = `${formattedText.value}::${backgroundStyleId.value}`

    emit('generated', {
      blob,
      width,
      height,
      backgroundStyleId: backgroundStyleId.value,
    })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
  finally {
    generating.value = false
  }
}

function clear () {
  if (generatedUrl.value?.startsWith('blob:')) URL.revokeObjectURL(generatedUrl.value)
  generatedUrl.value = null
  lastSignature.value = null
  emit('cleared')
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <header class="flex flex-wrap items-center gap-3">
      <h3 class="text-sm text-muted">
        Generated image
      </h3>
      <label class="text-xs text-muted flex items-center gap-2">
        Background
        <select
          v-model="backgroundStyleId"
          class="bg-accent px-2 py-1"
        >
          <option
            v-for="bg in BACKGROUND_STYLES"
            :key="bg.id"
            :value="bg.id"
          >
            {{ bg.title }}
          </option>
        </select>
      </label>
      <div class="ml-auto flex gap-2">
        <button
          type="button"
          :disabled="!hasContent || generating"
          class="bg-primary text-background px-3 py-1 text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          @click="generate"
        >
          {{ generating ? 'Generating…' : (generatedUrl ? 'Regenerate' : 'Generate') }}
        </button>
        <button
          v-if="generatedUrl"
          type="button"
          class="text-sm text-muted hover:text-red-500"
          @click="clear"
        >
          Remove
        </button>
      </div>
    </header>

    <p
      v-if="error"
      class="text-sm text-red-500"
    >
      {{ error }}
    </p>

    <p
      v-if="!hasContent"
      class="text-sm text-muted"
    >
      Once the question text is set, click Generate to render the image. It stays in your browser until you publish.
    </p>

    <!--
      Source preview keeps the 1200px-wide layout (so modern-screenshot
      captures the right size) and is shrunk with `transform: scale()`
      for display. The wrapper is sized to the scaled dimensions via a
      ResizeObserver. `zoom` would simplify the math but is non-standard
      and creates a stacking context that breaks the background's
      `z-index`.
    -->
    <div
      v-if="hasContent"
      class="grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      <figure class="bg-accent p-2 overflow-hidden flex flex-col gap-2">
        <figcaption class="text-xs text-muted">
          Source preview
        </figcaption>
        <div
          ref="previewWrapperRef"
          class="relative overflow-hidden"
          :style="{ height: previewWrapperHeight }"
        >
          <div
            ref="terminalRef"
            :style="{
              width: '1200px',
              height: 'auto',
              padding: '96px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
            }"
          >
            <div
              :style="{
                width: '100%',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: 'rgb(4, 4, 4) 0px 0px 0px 1px, rgba(255, 255, 255, 0.18) 0px 1px 0px inset, rgba(0, 0, 0, 0.6) 0px 0px 18px 1px',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
              }"
            >
              <div
                :style="{
                  height: '64px',
                  background: '#292d3e',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '20px',
                  position: 'relative',
                }"
              >
                <div style="display: flex; gap: 14px">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: #ff5f57; border: 1px solid #e53e3e" />
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: #ffbd2e; border: 1px solid #d69e2e" />
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: #28ca42; border: 1px solid #38a169" />
                </div>
                <div
                  :style="{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#64748b',
                    fontSize: '24px',
                    whiteSpace: 'nowrap',
                    fontWeight: '500',
                    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
                  }"
                >
                  ~/question.md
                </div>
              </div>

              <div
                :style="{
                  padding: '40px',
                  paddingLeft: '0px',
                  display: 'flex',
                  fontWeight: 600,
                  fontFamily: 'JetBrains Mono, Monaco, monospace',
                  fontSize: '24px',
                  lineHeight: '32px',
                  paddingTop: '48px',
                  paddingBottom: '64px',
                  color: '#d0d0d0',
                  background: '#292d3e',
                }"
              >
                <div
                  :style="{
                    width: '68px',
                    flexShrink: 0,
                    paddingRight: '32px',
                    color: '#94a3b8',
                    fontSize: '16px',
                    fontVariantNumeric: 'tabular-nums',
                    userSelect: 'none',
                    lineHeight: '32px',
                  }"
                >
                  <div
                    v-for="n in lineNumbers"
                    :key="n"
                    style="height: 32px; display: flex; justify-content: flex-end"
                  >
                    {{ n }}
                  </div>
                </div>

                <div
                  ref="contentRef"
                  :style="{
                    flex: 1,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    lineHeight: '32px',
                    paddingRight: '40px',
                    maxWidth: 'calc(100% - 68px)',
                    overflowWrap: 'break-word',
                  }"
                >
                  {{ formattedText }}
                </div>
              </div>
            </div>

            <div
              :style="{
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
                fontSize: '24px',
                marginRight: '1rem',
                flexDirection: 'row',
                justifyContent: 'space-between',
                display: 'flex',
                whiteSpace: 'nowrap',
                textAlign: 'right',
                fontWeight: '500',
                position: 'relative',
                zIndex: 1,
              }"
            >
              <div style="margin-top: 1.25rem">
                roe.dev/ama
              </div>
              <div style="margin-top: 1.25rem">
                asked {{ relativeDate }}
              </div>
            </div>

            <!--
            Background. Has to stack *behind* the editor window without
            being clipped by it. Placing it last in document order (so it’d
            naturally be on top) but with `z-index: 0` against the
            terminal's `position: relative` plus `z-index: 1` on the
            foreground works inside a `transform`/`zoom` parent;
            `z-index: -1` doesn’t.
          -->
            <div :style="{ position: 'absolute', inset: '0', overflow: 'hidden', zIndex: 0 }">
              <div :style="{ position: 'absolute', inset: '-9em', ...backgroundStyle.style }" />
            </div>
          </div>
        </div>
      </figure>

      <figure
        v-if="generatedUrl"
        class="bg-accent p-2 overflow-hidden flex flex-col gap-2"
      >
        <figcaption class="text-xs text-muted">
          Generated image
        </figcaption>
        <img
          :src="generatedUrl"
          alt="Generated AMA image preview"
          class="block w-full h-auto"
        >
      </figure>
    </div>
  </section>
</template>
