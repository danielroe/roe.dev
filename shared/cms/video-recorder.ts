/**
 * Record the AMA generator DOM as a silent webm video, frame-by-frame,
 * using WebCodecs + mediabunny. Browser-only.
 */
import { gsap } from 'gsap'
import { domToBlob } from 'modern-screenshot'
import { Output, WebMOutputFormat, BufferTarget, VideoSampleSource, VideoSample } from 'mediabunny'

import { ANIMATION_CONFIG, calculateVideoDuration } from './video-animation-config'
import { createGSAPTimeline, resetCharacterStates } from './video-gsap-animations'

interface VideoOptions {
  element: HTMLElement
  question: string
  questionLines: string[]
  answer: string
  answerLines: string[]
  relativeDate: string
  typingIntervals?: number[]
  onProgress?: (progress: number) => void
}

export async function createVideo (options: VideoOptions): Promise<Blob> {
  const { questionLines, answerLines, question, typingIntervals, onProgress } = options

  const targetFPS = ANIMATION_CONFIG.recordingFrameRate || 24
  const duration = calculateVideoDuration(questionLines.length, answerLines.length, question, typingIntervals)

  if (!isWebCodecsSupported()) {
    throw new Error('WebCodecs not supported. Please use Firefox 130+, Chrome 94+, or Safari 16.4+')
  }

  return recordVideo({
    element: options.element,
    targetFPS,
    duration,
    width: 1080,
    height: 1920,
    typingIntervals,
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

interface VideoRecorderOptions {
  element: HTMLElement
  targetFPS: number
  duration: number
  width: number
  height: number
  typingIntervals?: number[]
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

export function isWebCodecsSupported (): boolean {
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

async function recordVideo (options: VideoRecorderOptions): Promise<Blob> {
  const { element, targetFPS, duration, width, height, typingIntervals, onProgress } = options

  let container = element.querySelector('.video-container') as HTMLElement
  if (!container && element.classList.contains('video-container')) {
    container = element
  }
  if (!container) throw new Error('Video container not found')

  resetCharacterStates(container)

  const { timeline, destroy } = createGSAPTimeline(container, typingIntervals)
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

  const output = new Output({
    format: new WebMOutputFormat(),
    target: new BufferTarget(),
  })

  const videoSource = new VideoSampleSource({
    codec: 'vp9',
    bitrate: 3000000,
  })

  output.addVideoTrack(videoSource, { frameRate: targetFPS })

  await output.start()

  try {
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const progress = frameIndex / (totalFrames - 1)
      const timestamp = frameIndex * frameDurationMicros

      onProgress?.(progress)

      // Drive the GSAP timeline to the exact frame position.
      const currentTime = progress * duration
      timeline.time(currentTime)
      gsap.ticker.tick()

      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

      const blob = await domToBlob(container, {
        width,
        height,
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        quality: 1.0,
        type: 'image/png',
      })

      const imageBitmap = await blobToImageBitmap(blob)
      const videoFrame = new window.VideoFrame!(imageBitmap, {
        timestamp,
        duration: frameDurationMicros,
      })

      const videoSample = new VideoSample(videoFrame)
      const keyFrame = frameIndex % (config.keyFrameEvery || 24) === 0
      try {
        await videoSource.add(videoSample, { keyFrame })
      }
      finally {
        // mediabunny holds VideoSamples until GC unless we close them
        // explicitly; uncleared samples surface as a warning every batch.
        videoSample.close()
        videoFrame.close()
        imageBitmap.close()
      }
    }

    videoSource.close()
    await output.finalize()

    const webmBuffer = output.target.buffer
    if (!webmBuffer) throw new Error('Failed to generate video buffer')
    return new Blob([webmBuffer], { type: 'video/webm' })
  }
  finally {
    destroy()
  }
}
