import { gsap } from 'gsap'
import { domToBlob } from 'modern-screenshot'
import { Muxer, ArrayBufferTarget } from 'webm-muxer'
import {
  ANIMATION_CONFIG,
  calculateVideoDuration,
} from './tiktok-animation-config'
import { createTikTokGSAPTimeline, resetCharacterStates } from './tiktok-gsap-animations'

interface AudioTrack {
  id: string
  name: string
  artist: string
  duration: number
  url: string
  tags: string[]
}

interface TikTokVideoOptions {
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

export async function createTikTokVideo (options: TikTokVideoOptions): Promise<Blob> {
  const { questionLines, answerLines, question, typingIntervals, audioTrack, audioStartTime = 0, audioVolume = 0.7, onProgress } = options

  const targetFPS = ANIMATION_CONFIG.recordingFrameRate || 24
  const duration = calculateVideoDuration(questionLines.length, answerLines.length, question, typingIntervals)

  if (!isPureWebCodecsSupported()) {
    throw new Error('WebCodecs not supported. Please use Firefox 130+, Chrome 94+, or Safari 16.4+')
  }

  return await recordTikTokWithPureWebCodecs({
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

/**
 * Record TikTok video using pure WebCodecs with proper WebM muxing
 */
export async function recordTikTokWithPureWebCodecs (options: PureWebCodecsRecorderOptions): Promise<Blob> {
  const { element, targetFPS, duration, width, height, typingIntervals, audioTrack, audioStartTime = 0, audioVolume = 0.7, onProgress } = options

  let container = element.querySelector('.tiktok-container') as HTMLElement
  if (!container && element.classList.contains('tiktok-container')) {
    container = element
  }
  if (!container) {
    throw new Error('TikTok container not found')
  }

  // Reset all character states before starting animation
  resetCharacterStates(container)

  const { timeline, destroy } = createTikTokGSAPTimeline(container, typingIntervals)
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

  // Process audio if provided and encode it properly
  let audioChannels: Float32Array[] | null = null
  let audioEncoder: AudioEncoder | null = null
  const audioSampleRate = 48000
  const audioFrameSize = 960 // Standard Opus frame size for 48kHz (20ms)

  if (audioTrack) {
    try {
      console.log('🎵 Processing audio track:', audioTrack.name)
      audioChannels = await processAudioTrack(audioTrack, duration, audioStartTime, audioVolume)

      if (audioChannels && audioChannels.length > 0) {
        console.log('🎵 Setting up audio encoder for WebM muxing')

        // Create audio encoder for Opus
        audioEncoder = new AudioEncoder({
          output: (chunk, metadata) => {
            muxer.addAudioChunk(chunk, metadata)
          },
          error: (error: Error) => {
            console.warn('Audio encoding error:', error)
          },
        })

        // Configure audio encoder for Opus
        audioEncoder.configure({
          codec: 'opus',
          sampleRate: audioSampleRate,
          numberOfChannels: 2,
          bitrate: 128000, // 128 kbps
        })

        console.log('✅ Audio encoder configured')
      }
    }
    catch (error) {
      console.warn('Failed to process audio, continuing without audio:', error)
      audioChannels = null
      audioEncoder = null
    }
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
    audio: audioChannels
      ? {
          codec: 'A_OPUS',
          sampleRate: 48000,
          numberOfChannels: 2,
        }
      : undefined,
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

      // Add audio frames if audio encoder is available
      if (audioEncoder && audioChannels && frameIndex === 0) {
        try {
          console.log('🎵 Encoding audio frames')

          // Process audio in chunks that match the Opus frame size
          const samplesPerFrame = audioFrameSize
          const totalSamples = audioChannels[0].length
          const totalAudioFrames = Math.ceil(totalSamples / samplesPerFrame)

          for (let audioFrameIndex = 0; audioFrameIndex < totalAudioFrames; audioFrameIndex++) {
            const startSample = audioFrameIndex * samplesPerFrame
            const endSample = Math.min(startSample + samplesPerFrame, totalSamples)
            const frameSamples = endSample - startSample

            // Prepare planar audio data (separate channels, not interleaved)
            const leftChannelData = new Float32Array(frameSamples)
            const rightChannelData = new Float32Array(frameSamples)

            for (let i = 0; i < frameSamples; i++) {
              // Clamp samples to prevent distortion
              leftChannelData[i] = Math.max(-1, Math.min(1, audioChannels[0][startSample + i] || 0))
              rightChannelData[i] = Math.max(-1, Math.min(1, audioChannels[1] ? audioChannels[1][startSample + i] || 0 : leftChannelData[i]))
            }

            // Create planar data buffer (left channel followed by right channel)
            const planarData = new Float32Array(frameSamples * 2)
            planarData.set(leftChannelData, 0)
            planarData.set(rightChannelData, frameSamples)

            // Calculate timestamp for this audio frame
            const audioTimestamp = (audioFrameIndex * samplesPerFrame / audioSampleRate) * 1000000 // microseconds

            // Create AudioData object with correct planar format
            const audioData = new AudioData({
              format: 'f32-planar',
              sampleRate: audioSampleRate,
              numberOfChannels: 2,
              numberOfFrames: frameSamples,
              timestamp: audioTimestamp,
              data: planarData,
            })

            // Encode audio frame
            audioEncoder.encode(audioData)
            audioData.close()
          }

          console.log(`✅ Encoded ${totalAudioFrames} audio frames`)
        }
        catch (error) {
          console.warn('Failed to encode audio:', error)
        }
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

    if (audioEncoder) {
      await audioEncoder.flush()
      audioEncoder.close()
    }

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
