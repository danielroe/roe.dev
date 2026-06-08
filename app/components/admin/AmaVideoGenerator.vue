<script setup lang="ts">
import { gsap } from 'gsap'
import { calculateVideoDuration } from '#shared/cms/video-animation-config'
import { createVideo } from '#shared/cms/video-recorder'
import {
  createPreviewAnimation,
  stopAnimations,
  type GSAPTimeline,
} from '#shared/cms/video-gsap-animations'
import { getBackgroundStyle } from '#shared/cms/backgrounds'

interface PendingVideo {
  blob: Blob
  width: number
  height: number
  durationSeconds: number
}

const props = defineProps<{
  question: string
  answer: string
  backgroundStyleId?: string
}>()

const emit = defineEmits<{
  (e: 'generated', value: PendingVideo): void
  (e: 'cleared'): void
}>()

const backgroundStyle = computed(() => getBackgroundStyle(props.backgroundStyleId))

const generating = ref(false)
const progress = ref(0)
const error = ref<string | null>(null)
const localVideoUrl = ref<string | null>(null)

const videoContainerRef = ref<HTMLDivElement | null>(null)
const gsapAnimationRef = ref<GSAPTimeline | null>(null)

onBeforeUnmount(() => {
  if (gsapAnimationRef.value) gsapAnimationRef.value.destroy()
  if (videoContainerRef.value) stopAnimations(videoContainerRef.value)
  if (localVideoUrl.value) URL.revokeObjectURL(localVideoUrl.value)
})

const formattedQuestion = computed(() => props.question.trim())
const formattedAnswer = computed(() => props.answer.trim())
const hasContent = computed(() => Boolean(formattedQuestion.value && formattedAnswer.value))

// Deterministic per-character typing delays seeded by the question text
// so the same question always types at the same speed. ~50ms baseline
// with brief gaps between words.
const typingIntervals = computed(() => {
  if (!formattedQuestion.value) return [] as number[]
  const seed = formattedQuestion.value.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1000
  let randomSeed = seed
  const next = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }
  const intervals: number[] = []
  const words = formattedQuestion.value.split(' ')
  for (let w = 0; w < words.length; w++) {
    const word = words[w]!
    if (w > 0) intervals.push(Math.floor(next() * 100) + 50)
    for (let c = 0; c < word.length; c++) intervals.push(Math.floor(next() * 50) + 30)
    if (w < words.length - 1) intervals.push(Math.floor(next() * 300) + 100)
  }
  return intervals
})

interface AnswerLine {
  text: string
  isAfterLineBreak: boolean
  isNewParagraph: boolean
}

const answerLines = computed<AnswerLine[]>(() => {
  if (!formattedAnswer.value) return []
  const paragraphs = formattedAnswer.value.split('\n').map(p => p.trim()).filter(Boolean)
  const lines: AnswerLine[] = []

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const paragraph = paragraphs[pi]!
    const isAfterLineBreak = pi > 0
    let isFirstLineOfParagraph = true
    const sentences = paragraph.match(/[^.!?]*[.!?]+|[^.!?]+$/g) || [paragraph]

    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (!trimmed) continue
      if (trimmed.length > 30) {
        const words = trimmed.split(' ')
        let currentLine = ''
        for (const word of words) {
          if (currentLine.length + word.length + 1 <= 30) {
            currentLine += (currentLine ? ' ' : '') + word
          }
          else {
            if (currentLine) {
              lines.push({
                text: currentLine,
                isAfterLineBreak: isAfterLineBreak && isFirstLineOfParagraph,
                isNewParagraph: pi > 0 && isFirstLineOfParagraph,
              })
              isFirstLineOfParagraph = false
            }
            currentLine = word
          }
        }
        if (currentLine) {
          lines.push({
            text: currentLine,
            isAfterLineBreak: isAfterLineBreak && isFirstLineOfParagraph,
            isNewParagraph: pi > 0 && isFirstLineOfParagraph,
          })
          isFirstLineOfParagraph = false
        }
      }
      else {
        lines.push({
          text: trimmed,
          isAfterLineBreak: isAfterLineBreak && isFirstLineOfParagraph,
          isNewParagraph: pi > 0 && isFirstLineOfParagraph,
        })
        isFirstLineOfParagraph = false
      }
    }
  }
  return lines
})

const videoDuration = computed(() => calculateVideoDuration(1, answerLines.value.length, formattedQuestion.value, typingIntervals.value))

// Word-wrapped question lines + per-character spans for the typewriter
// effect. The 39-char wrap is tuned against the 900px-wide question
// window.
interface QuestionRender {
  lines: Array<{ chars: Array<{ char: string, globalIndex: number }> }>
}
const questionRender = computed<QuestionRender>(() => {
  const text = formattedQuestion.value
  if (!text) return { lines: [] }
  const maxLineLength = 39
  const words = text.split(/\s+/).filter(Boolean)
  const rawLines: string[] = []
  let currentLine = ''
  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxLineLength && currentLine.length > 0) {
      rawLines.push(currentLine.trim())
      currentLine = word
    }
    else {
      currentLine += (currentLine ? ' ' : '') + word
    }
  }
  if (currentLine) rawLines.push(currentLine.trim())

  let globalIndex = 0
  return {
    lines: rawLines.map(line => ({
      chars: line.split('').map(char => ({
        char: char === ' ' ? '\u00A0' : char,
        globalIndex: globalIndex++,
      })),
    })),
  }
})

// Restart the looping GSAP preview when content or background changes,
// so the editor stays in sync with what the recorded video looks like.
async function refreshPreview () {
  if (!videoContainerRef.value) return
  if (gsapAnimationRef.value) {
    gsapAnimationRef.value.destroy()
    gsapAnimationRef.value = null
  }
  stopAnimations(videoContainerRef.value)

  if (!hasContent.value || generating.value) return

  await nextTick()
  try {
    gsapAnimationRef.value = createPreviewAnimation(videoContainerRef.value, typingIntervals.value)
  }
  catch (err) {
    console.warn('[ama-video] preview animation failed:', err)
  }
}

watch([formattedQuestion, formattedAnswer, () => props.backgroundStyleId], () => refreshPreview())
onMounted(refreshPreview)

async function generate () {
  if (!hasContent.value || !videoContainerRef.value || generating.value) return

  generating.value = true
  progress.value = 0
  error.value = null

  // Tear down the looping preview before frame capture.
  if (gsapAnimationRef.value) {
    gsapAnimationRef.value.destroy()
    gsapAnimationRef.value = null
  }
  stopAnimations(videoContainerRef.value)
  await new Promise(r => setTimeout(r, 100))

  try {
    const questionLines = [formattedQuestion.value]
    const videoAnswerLines = answerLines.value.map(l => l.text)

    const videoBlob = await createVideo({
      element: videoContainerRef.value,
      question: formattedQuestion.value,
      questionLines,
      answer: formattedAnswer.value,
      answerLines: videoAnswerLines,
      relativeDate: '',
      typingIntervals: typingIntervals.value,
      onProgress: p => { progress.value = Math.round(p * 100) },
    })

    if (localVideoUrl.value) URL.revokeObjectURL(localVideoUrl.value)
    localVideoUrl.value = URL.createObjectURL(videoBlob)

    emit('generated', {
      blob: videoBlob,
      width: 1080,
      height: 1920,
      durationSeconds: videoDuration.value,
    })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
  finally {
    generating.value = false
    progress.value = 0
    // Resume the looping preview now the capture is done.
    refreshPreview()
  }
}

function clear () {
  if (localVideoUrl.value) URL.revokeObjectURL(localVideoUrl.value)
  localVideoUrl.value = null
  emit('cleared')
}

// gsap.ticker is used by createVideo to advance frames; making sure it
// runs on mount avoids a first-frame lag on the initial recording.
onMounted(() => {
  gsap.ticker.tick()
})
</script>

<template>
  <section class="flex flex-col gap-3">
    <header class="flex flex-wrap items-center gap-3">
      <h3 class="text-sm text-muted">
        Generated video
      </h3>
      <span class="text-xs text-muted">
        {{ Math.ceil(videoDuration) }}s · 1080×1920
      </span>
      <div class="ml-auto flex gap-2">
        <button
          type="button"
          :disabled="!hasContent || generating"
          class="bg-primary text-background px-3 py-1 text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          @click="generate"
        >
          {{ generating ? `Generating ${progress}%` : (localVideoUrl ? 'Regenerate' : 'Generate') }}
        </button>
        <button
          v-if="localVideoUrl"
          type="button"
          class="text-sm text-muted hover:text-red-500"
          @click="clear"
        >
          Remove
        </button>
      </div>
    </header>

    <div
      v-if="generating"
      class="w-full h-1 bg-accent overflow-hidden"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full bg-primary transition-all duration-200"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <p
      v-if="error"
      class="text-sm text-red-500"
    >
      {{ error }}
    </p>

    <video
      v-if="localVideoUrl"
      :src="localVideoUrl"
      controls
      class="block bg-accent max-w-xs aspect-[9/16] w-full"
    />

    <!--
      Off-screen 1080×1920 stage used by both the GSAP preview animation
      and frame capture. modern-screenshot inlines computed styles, so
      positioning it off-screen doesn't affect the rendered output.
    -->
    <div
      v-if="hasContent"
      class="overflow-hidden"
      style="height: 0"
      aria-hidden="true"
    >
      <div
        ref="videoContainerRef"
        class="video-container"
        :style="{
          width: '1080px',
          height: '1920px',
          position: 'relative',
          overflow: 'hidden',
          display: 'block',
          isolation: 'isolate',
        }"
      >
        <div :style="{ position: 'absolute', inset: '-9em', ...backgroundStyle.style }" />

        <div
          class="question-window"
          :style="{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '900px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: 'rgb(4, 4, 4) 0px 0px 0px 1px, rgba(255, 255, 255, 0.18) 0px 1px 0px inset, rgba(0, 0, 0, 0.6) 0px 0px 18px 1px',
            overflow: 'hidden',
          }"
        >
          <div
            :style="{
              height: '64px',
              background: '#292d3e',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '32px',
              position: 'relative',
            }"
          >
            <div style="display: flex; gap: 16px">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #ff5f57; border: 1px solid #e53e3e" />
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #ffbd2e; border: 1px solid #d69e2e" />
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #28ca42; border: 1px solid #38a169" />
            </div>
            <div
              :style="{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#64748b',
                fontSize: '32px',
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
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono, Monaco, monospace',
              fontSize: '32px',
              lineHeight: '42px',
              color: '#d0d0d0',
              background: '#292d3e',
            }"
          >
            <div
              class="question-content"
              :data-question-text="formattedQuestion"
              :style="{
                flex: 1,
                position: 'relative',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                lineHeight: '42px',
                paddingRight: '40px',
                overflowWrap: 'break-word',
              }"
            >
              <div
                v-for="(line, lineIndex) in questionRender.lines"
                :key="lineIndex"
                style="display: block"
              >
                <span
                  v-for="chunk in line.chars"
                  :key="chunk.globalIndex"
                  :class="`question-char char-${chunk.globalIndex}`"
                  :style="{ opacity: 0, visibility: 'hidden' }"
                >{{ chunk.char }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="answer-container"
          :style="{
            position: 'absolute',
            top: '150px',
            left: '150px',
            right: '60px',
            margin: '0 auto',
            display: 'flex',
            height: '75%',
            flexDirection: 'column',
            justifyContent: 'center',
          }"
        >
          <div
            v-for="(line, lineIndex) in answerLines"
            :key="lineIndex"
            class="answer-line"
            :style="{
              color: '#000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
              fontSize: '58px',
              fontWeight: '600',
              lineHeight: '1.2',
              textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)',
              marginBottom: '12px',
              marginTop: line.isNewParagraph ? '48px' : (line.isAfterLineBreak ? '36px' : '0'),
            }"
          >
            {{ line.text }}
          </div>
        </div>

        <div
          class="cta-container"
          :style="{
            position: 'absolute',
            bottom: '200px',
            left: '80px',
            right: '80px',
            textAlign: 'center',
          }"
        >
          <div
            :style="{
              color: '#ffffff',
              fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
              fontSize: '48px',
              fontWeight: 'bold',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              marginBottom: '24px',
            }"
          >
            Ask me anything at
          </div>
          <div
            :style="{
              color: '#ffffff',
              fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
              fontSize: '64px',
              fontWeight: 'bold',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              textDecoration: 'underline',
            }"
          >
            roe.dev/ama
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
