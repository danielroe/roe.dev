import type { H3Event } from 'h3'

import { getValidYouTubeAccessToken } from '../youtube/auth'

export interface YouTubeMetadata {
  title: string
  description: string
  hashtags: string[]
}

// Title is the (truncated) question; hashtags blend a baseline set with
// topic-specific tags matched against a small keyword list.
export function generateVideoMetadata (question: string, answer: string): YouTubeMetadata {
  const title = question.length > 47 ? question.slice(0, 47) + '…' : question

  const contentText = `${question} ${answer}`.toLowerCase()
  const baseHashtags = ['AMA', 'QandA', 'Tech', 'Programming', 'Developer']
  const contextHashtags: string[] = []
  const techKeywords: Record<string, string[]> = {
    nuxt: ['Nuxt', 'NuxtJS'],
    vue: ['Vue', 'VueJS'],
    javascript: ['JavaScript', 'JS'],
    typescript: ['TypeScript', 'TS'],
    node: ['NodeJS', 'Node'],
    react: ['React', 'ReactJS'],
    css: ['CSS', 'Styling'],
    performance: ['Performance', 'Optimization'],
    security: ['Security', 'Auth'],
    database: ['Database', 'DB'],
    api: ['API', 'Backend'],
    frontend: ['Frontend', 'UI'],
    fullstack: ['FullStack', 'WebDev'],
    opensource: ['OpenSource', 'OSS'],
    git: ['Git', 'GitHub'],
    deployment: ['Deployment', 'DevOps'],
    testing: ['Testing', 'QA'],
    ai: ['AI', 'MachineLearning'],
    mobile: ['Mobile', 'App'],
    web: ['WebDevelopment', 'Web'],
  }
  for (const [keyword, tags] of Object.entries(techKeywords)) {
    if (contentText.includes(keyword)) contextHashtags.push(...tags.slice(0, 1))
  }
  const allHashtags = [...baseHashtags, ...contextHashtags].slice(0, 8)

  const shortAnswer = answer.length > 100 ? answer.slice(0, 97) + '…' : answer
  const hashtagString = allHashtags.map(t => `#${t}`).join(' ')
  const description = `Q: ${question}\n\nA: ${shortAnswer}\n\nroe.dev/ama\n\n${hashtagString}`

  return { title, description, hashtags: allHashtags }
}

interface UploadOptions {
  accessToken: string
  videoBuffer: Uint8Array
  videoMimeType: string
  title: string
  description: string
  categoryId: string
  tags: string[]
  privacyStatus: 'public' | 'private' | 'unlisted'
  playlistId?: string
}

async function uploadToYouTube (options: UploadOptions): Promise<{ videoId: string }> {
  const { accessToken, videoBuffer, videoMimeType, title, description, categoryId, tags, privacyStatus, playlistId } = options

  const metadata = {
    snippet: { title, description, tags, categoryId },
    status: { privacyStatus },
  }

  const boundary = `----formdata-${Date.now()}`
  const delimiter = '\r\n--' + boundary + '\r\n'
  const closeDelimiter = '\r\n--' + boundary + '--'

  let body = delimiter
  body += 'Content-Type: application/json; charset=UTF-8\r\n\r\n'
  body += JSON.stringify(metadata)
  body += delimiter
  body += `Content-Type: ${videoMimeType}\r\n\r\n`

  const bodyStart = new TextEncoder().encode(body)
  const bodyEnd = new TextEncoder().encode(closeDelimiter)
  const fullBody = new Uint8Array(bodyStart.length + videoBuffer.length + bodyEnd.length)
  fullBody.set(bodyStart, 0)
  fullBody.set(videoBuffer, bodyStart.length)
  fullBody.set(bodyEnd, bodyStart.length + videoBuffer.length)

  const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: fullBody,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const result = await response.json() as { id?: string }
  if (!result.id) throw new Error('YouTube upload failed: No video ID returned')

  if (playlistId) {
    try {
      await addVideoToPlaylist(accessToken, result.id, playlistId)
    }
    catch (error) {
      console.warn('[youtube] playlist add failed:', error)
    }
  }

  return { videoId: result.id }
}

async function addVideoToPlaylist (accessToken: string, videoId: string, playlistId: string): Promise<void> {
  const playlistItem = {
    snippet: {
      playlistId,
      resourceId: { kind: 'youtube#video', videoId },
    },
  }

  const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(playlistItem),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube playlist API error: ${response.status} ${response.statusText} - ${errorText}`)
  }
}

export interface PublishYouTubeOptions {
  question: string
  answer: string
  videoBuffer: Uint8Array
  videoMimeType: string
}

export async function publishYouTubeShorts (
  event: H3Event,
  options: PublishYouTubeOptions,
): Promise<{ url: string }> {
  const config = useRuntimeConfig(event)
  const accessToken = await getValidYouTubeAccessToken(event)

  const meta = generateVideoMetadata(options.question, options.answer)
  const title = meta.title.length > 100 ? meta.title.slice(0, 97) + '…' : meta.title
  const shortAnswer = options.answer.length > 200 ? options.answer.slice(0, 200) + '…' : options.answer
  const description = `Q: ${options.question}\n\nA: ${shortAnswer}\n\n🔗 roe.dev/ama\n\n${meta.hashtags.map(t => `#${t}`).join(' ')}`

  const { videoId } = await uploadToYouTube({
    accessToken,
    videoBuffer: options.videoBuffer,
    videoMimeType: options.videoMimeType,
    title,
    description,
    categoryId: '28', // Science & Technology
    tags: meta.hashtags,
    privacyStatus: 'public',
    playlistId: config.youtube.amaPlaylistId,
  })

  return { url: `https://www.youtube.com/watch?v=${videoId}` }
}
