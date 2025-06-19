import { gsap } from 'gsap'
import { domToBlob } from 'modern-screenshot'
import { Muxer, ArrayBufferTarget } from 'webm-muxer'
import {
  ANIMATION_CONFIG,
  calculateVideoDuration,
} from './tiktok-animation-config'
import { createTikTokGSAPTimeline, resetCharacterStates } from './tiktok-gsap-animations'

interface TikTokVideoOptions {
  element: HTMLElement
  question: string
  questionLines: string[]
  answer: string
  answerLines: string[]
  relativeDate: string
  onProgress?: (progress: number) => void
}

export async function createTikTokVideo (options: TikTokVideoOptions): Promise<Blob> {
  const { questionLines, answerLines, question, onProgress } = options

  const targetFPS = ANIMATION_CONFIG.recordingFrameRate || 24
  const duration = calculateVideoDuration(questionLines.length, answerLines.length, question)

  if (!isPureWebCodecsSupported()) {
    throw new Error('WebCodecs not supported. Please use Firefox 130+, Chrome 94+, or Safari 16.4+')
  }

  return await recordTikTokWithPureWebCodecs({
    element: options.element,
    targetFPS,
    duration,
    width: 1080,
    height: 1920,
    onProgress,
  })
}

declare global {
  interface Window {
    VideoEncoder?: typeof VideoEncoder
    VideoFrame?: typeof VideoFrame
    VideoDecoder?: typeof VideoDecoder
    EncodedVideoChunk?: typeof EncodedVideoChunk
  }
}

export interface PureWebCodecsRecorderOptions {
  element: HTMLElement
  targetFPS: number
  duration: number
  width: number
  height: number
  onProgress?: (progress: number) => void
}

interface VideoEncoderConfig {
  codec: string
  width: number
  height: number
  bitrate: number
  framerate: number
  keyFrameEvery?: number
}

export function isPureWebCodecsSupported (): boolean {
  return typeof window !== 'undefined'
    && 'VideoEncoder' in window
    && 'VideoFrame' in window
    && 'EncodedVideoChunk' in window
    && typeof window.VideoEncoder === 'function'
}

async function blobToImageBitmap (blob: Blob): Promise<ImageBitmap> {
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
    })
    return await createImageBitmap(image)
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Record TikTok video using pure WebCodecs with proper WebM muxing
 */
export async function recordTikTokWithPureWebCodecs (options: PureWebCodecsRecorderOptions): Promise<Blob> {
  const { element, targetFPS, duration, width, height, onProgress } = options

  let container = element.querySelector('.tiktok-container') as HTMLElement
  if (!container && element.classList.contains('tiktok-container')) {
    container = element
  }
  if (!container) {
    throw new Error('TikTok container not found')
  }

  // Reset all character states before starting animation
  resetCharacterStates(container)

  const { timeline, destroy } = createTikTokGSAPTimeline(container)
  const totalFrames = Math.ceil(duration * targetFPS)
  const frameDurationMicros = Math.floor(1000000 / targetFPS)

  const config: VideoEncoderConfig = {
    codec: 'vp09.00.10.08',
    width,
    height,
    bitrate: 3000000, // 3 Mbps
    framerate: targetFPS,
    keyFrameEvery: 24,
  }

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: {
      codec: 'V_VP9',
      width,
      height,
      frameRate: targetFPS,
    },
    firstTimestampBehavior: 'offset',
  })

  let _encodedFrameCount = 0

  const encoder = new window.VideoEncoder({
    output: chunk => {
      muxer.addVideoChunk(chunk)
      _encodedFrameCount++
    },
    error: (error: Error) => {
      throw error
    },
  })

  encoder.configure(config)

  try {
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const progress = frameIndex / (totalFrames - 1)
      const timestamp = frameIndex * frameDurationMicros

      // Report progress
      if (onProgress) {
        onProgress(progress)
      }

      // Update GSAP timeline to exact time position (not progress)
      const currentTime = progress * duration
      timeline.time(currentTime)
      gsap.ticker.tick()

      // Wait for DOM update
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => resolve())
      })

      const blob = await domToBlob(container, {
        width,
        height,
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        quality: 1.0,
        type: 'image/png',
      })

      const imageBitmap = await blobToImageBitmap(blob)
      const videoFrame = new window.VideoFrame(imageBitmap, {
        timestamp,
        duration: frameDurationMicros,
      })

      const keyFrame = frameIndex % (config.keyFrameEvery || 24) === 0
      encoder.encode(videoFrame, { keyFrame })

      videoFrame.close()
      imageBitmap.close()
    }

    await encoder.flush()
    muxer.finalize()

    const webmBuffer = target.buffer
    const videoBlob = new Blob([webmBuffer], { type: 'video/webm' })
    return videoBlob
  }
  finally {
    encoder.close()
    destroy()
  }
}
