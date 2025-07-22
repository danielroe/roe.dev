import { gsap } from 'gsap'
import { domToBlob } from 'modern-screenshot'
import { Output, WebMOutputFormat, BufferTarget, VideoSampleSource, AudioBufferSource, VideoSample } from 'mediabunny'
import {
  ANIMATION_CONFIG,
  calculateVideoDuration,
} from './video-animation-config'
import { createGSAPTimeline, resetCharacterStates } from './video-gsap-animations'

interface AudioTrack {
  id: string
  name: string
  artist: string
  duration: number
  url: string
  tags: string[]
}

interface VideoOptions {
  element: HTMLElement
  question: string
  questionLines: string[]
  answer: string
  answerLines: string[]
  relativeDate: string
  typingIntervals?: number[]
  audioTrack?: AudioTrack
  audioStartTime?: number
  audioVolume?: number
  onProgress?: (progress: number) => void
}

export async function createVideo (options: VideoOptions): Promise<Blob> {
  const { questionLines, answerLines, question, typingIntervals, audioTrack, audioStartTime = 0, audioVolume = 0.7, onProgress } = options

  const targetFPS = ANIMATION_CONFIG.recordingFrameRate || 24
  const duration = calculateVideoDuration(questionLines.length, answerLines.length, question, typingIntervals)

  if (!isPureWebCodecsSupported()) {
    throw new Error('WebCodecs not supported. Please use Firefox 130+, Chrome 94+, or Safari 16.4+')
  }

  return await recordVideo({
    element: options.element,
    targetFPS,
    duration,
    width: 1080,
    height: 1920,
    typingIntervals,
    audioTrack,
    audioStartTime,
    audioVolume,
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
  typingIntervals?: number[]
  audioTrack?: AudioTrack
  audioStartTime?: number
  audioVolume?: number
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

async function processAudioTrack (audioTrack: AudioTrack, duration: number, startTime: number, volume: number): Promise<Float32Array[]> {
  try {
    // Fetch audio file
    const response = await fetch(audioTrack.url)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    // Don't force sample rate - let it decode naturally first
    const audioContext = new AudioContext()

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      console.log('🎵 Original audio:', {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
      })

      // If sample rate doesn't match our target (48kHz), we need to resample
      const targetSampleRate = 48000
      let processedBuffer = audioBuffer

      if (audioBuffer.sampleRate !== targetSampleRate) {
        console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz`)

        // Create offline context for resampling
        const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          Math.floor(audioBuffer.duration * targetSampleRate),
          targetSampleRate,
        )

        const source = offlineContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(offlineContext.destination)
        source.start(0)

        processedBuffer = await offlineContext.startRendering()
        console.log('✅ Audio resampled successfully')
      }

      // Calculate sample range for the video duration using the correct sample rate
      const sampleRate = processedBuffer.sampleRate
      const startSample = Math.floor(startTime * sampleRate)
      const endSample = Math.min(
        startSample + Math.floor(duration * sampleRate),
        processedBuffer.length,
      )
      const numSamples = endSample - startSample

      // Extract and process audio channels
      const processedChannels: Float32Array[] = []

      for (let channel = 0; channel < Math.min(processedBuffer.numberOfChannels, 2); channel++) {
        const channelData = processedBuffer.getChannelData(channel)
        const processedData = new Float32Array(numSamples)

        // Copy and apply volume with proper clipping
        for (let i = 0; i < numSamples; i++) {
          const sourceIndex = startSample + i
          if (sourceIndex < channelData.length) {
            // Apply volume and clamp to prevent distortion
            const sample = channelData[sourceIndex] * volume
            processedData[i] = Math.max(-1, Math.min(1, sample))
          }
          else {
            processedData[i] = 0 // Pad with silence if audio is shorter than video
          }
        }

        processedChannels.push(processedData)
      }

      // If mono, duplicate for stereo
      if (processedChannels.length === 1) {
        processedChannels.push(new Float32Array(processedChannels[0]))
      }

      return processedChannels
    }
    finally {
      await audioContext.close()
    }
  }
  catch (error) {
    console.warn('Failed to process audio track:', error)
    // Return silence if audio processing fails
    const sampleRate = 48000
    const numSamples = Math.floor(duration * sampleRate)
    return [new Float32Array(numSamples), new Float32Array(numSamples)]
  }
}

export async function recordVideo (options: PureWebCodecsRecorderOptions): Promise<Blob> {
  const { element, targetFPS, duration, width, height, typingIntervals, audioTrack, audioStartTime = 0, audioVolume = 0.7, onProgress } = options

  let container = element.querySelector('.video-container') as HTMLElement
  if (!container && element.classList.contains('video-container')) {
    container = element
  }
  if (!container) {
    throw new Error('Video container not found')
  }

  // Reset all character states before starting animation
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

  // Process audio if provided
  let audioChannels: Float32Array[] | null = null

  if (audioTrack) {
    try {
      console.log('🎵 Processing audio track:', audioTrack.name)
      audioChannels = await processAudioTrack(audioTrack, duration, audioStartTime, audioVolume)
      console.log('✅ Audio processed successfully')
    }
    catch (error) {
      console.warn('Failed to process audio, continuing without audio:', error)
      audioChannels = null
    }
  }

  const output = new Output({
    format: new WebMOutputFormat(),
    target: new BufferTarget(),
  })

  const videoSource = new VideoSampleSource({
    codec: 'vp9',
    bitrate: 3000000, // 3 Mbps
  })

  output.addVideoTrack(videoSource, {
    frameRate: targetFPS,
  })

  // Create audio source if we have audio
  let audioSource: AudioBufferSource | null = null
  if (audioChannels && audioChannels.length > 0) {
    audioSource = new AudioBufferSource({
      codec: 'opus',
      bitrate: 128000, // 128 kbps
    })
    output.addAudioTrack(audioSource)
  }

  // Start the output
  await output.start()

  // Process audio data if available
  if (audioSource && audioChannels) {
    try {
      console.log('🎵 Adding audio data')

      // Convert our processed audio channels into an AudioBuffer
      const audioSampleRate = 48000
      const audioContext = new AudioContext()
      const audioBuffer = audioContext.createBuffer(
        2, // stereo
        audioChannels[0].length,
        audioSampleRate,
      )

      // Copy channel data (create new Float32Array with ArrayBuffer)
      const leftChannel = new Float32Array(audioChannels[0])
      const rightChannel = new Float32Array(audioChannels[1])
      audioBuffer.copyToChannel(leftChannel, 0)
      audioBuffer.copyToChannel(rightChannel, 1)

      // Close the context as we only needed it for buffer creation
      await audioContext.close()

      // Add the audio buffer to the source
      await audioSource.add(audioBuffer)
      audioSource.close()

      console.log('✅ Audio data added')
    }
    catch (error) {
      console.warn('Failed to add audio:', error)
    }
  }

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

      const videoSample = new VideoSample(videoFrame)

      const keyFrame = frameIndex % (config.keyFrameEvery || 24) === 0
      await videoSource.add(videoSample, { keyFrame })

      videoFrame.close()
      imageBitmap.close()
    }

    videoSource.close()

    await output.finalize()

    const webmBuffer = output.target.buffer
    if (!webmBuffer) {
      throw new Error('Failed to generate video buffer')
    }
    const videoBlob = new Blob([webmBuffer], { type: 'video/webm' })
    return videoBlob
  }
  finally {
    destroy()
  }
}
