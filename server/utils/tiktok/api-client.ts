/**
 * TikTok API Client
 *
 * Handles authentication and API calls to TikTok's Content Posting API
 * Supports both regular posts and TikTok Stories
 */

export interface TikTokConfig {
  accessToken: string
  clientId?: string
  clientSecret?: string
}

export interface TikTokUploadResponse {
  data: {
    video_id: string
    upload_url: string
  }
  error?: {
    code: string
    message: string
  }
}

export interface TikTokPostResponse {
  data: {
    publish_id: string
  }
  error?: {
    code: string
    message: string
  }
}

export interface TikTokVideoInfo {
  title: string
  description?: string
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'
  disable_duet: boolean
  disable_comment: boolean
  disable_stitch: boolean
  video_cover_timestamp_ms: number
}

export class TikTokApiClient {
  private baseUrl = 'https://open.tiktokapis.com/v2'
  private config: TikTokConfig

  constructor (config: TikTokConfig) {
    this.config = config
  }

  /**
   * Initialize video upload and get upload URL
   */
  async initializeUpload (): Promise<TikTokUploadResponse> {
    const response = await fetch(`${this.baseUrl}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        source_info: {
          source: 'FILE_UPLOAD',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`TikTok upload init failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Upload video file to TikTok
   */
  async uploadVideo (videoBuffer: Buffer, uploadUrl: string): Promise<void> {
    const formData = new FormData()
    formData.append('video', new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' }), 'video.mp4')

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`TikTok video upload failed: ${response.status} ${response.statusText} - ${errorText}`)
    }
  }

  /**
   * Publish video to TikTok
   */
  async publishVideo (videoId: string, videoInfo: TikTokVideoInfo): Promise<TikTokPostResponse> {
    const postData = {
      source_info: {
        source: 'FILE_UPLOAD',
        video_id: videoId,
      },
      post_info: {
        title: videoInfo.title,
        description: videoInfo.description,
        privacy_level: videoInfo.privacy_level,
        disable_duet: videoInfo.disable_duet,
        disable_comment: videoInfo.disable_comment,
        disable_stitch: videoInfo.disable_stitch,
        video_cover_timestamp_ms: videoInfo.video_cover_timestamp_ms,
      },
      post_mode: 'DIRECT_POST',
    }

    const response = await fetch(`${this.baseUrl}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`TikTok video publish failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Check video processing status
   */
  async checkVideoStatus (publishId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        publish_id: publishId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`TikTok status check failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Get user info
   */
  async getUserInfo (): Promise<any> {
    const response = await fetch(`${this.baseUrl}/user/info/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`TikTok user info failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Complete video upload and publish workflow
   */
  async uploadAndPublish (videoBuffer: Buffer, videoInfo: TikTokVideoInfo): Promise<{ publishId: string, videoId: string }> {
    // Step 1: Initialize upload
    const uploadResponse = await this.initializeUpload()

    if (uploadResponse.error) {
      throw new Error(`Upload initialization failed: ${uploadResponse.error.message}`)
    }

    const { video_id, upload_url } = uploadResponse.data

    // Step 2: Upload video
    await this.uploadVideo(videoBuffer, upload_url)

    // Step 3: Publish video
    const publishResponse = await this.publishVideo(video_id, videoInfo)

    if (publishResponse.error) {
      throw new Error(`Video publish failed: ${publishResponse.error.message}`)
    }

    return {
      publishId: publishResponse.data.publish_id,
      videoId: video_id,
    }
  }
}

/**
 * Helper function to create TikTok video info from AMA content
 */
export function createTikTokVideoInfo (
  text: string,
  isStory: boolean = false,
  options: Partial<TikTokVideoInfo> = {},
): TikTokVideoInfo {
  const title = text.slice(0, isStory ? 50 : 150) // Shorter titles for stories

  return {
    title,
    description: options.description || text.slice(0, 300),
    privacy_level: options.privacy_level || 'PUBLIC_TO_EVERYONE',
    disable_duet: options.disable_duet ?? isStory, // Disable duet for stories
    disable_comment: options.disable_comment ?? false,
    disable_stitch: options.disable_stitch ?? isStory, // Disable stitch for stories
    video_cover_timestamp_ms: options.video_cover_timestamp_ms || (isStory ? 500 : 1000),
  }
}

/**
 * Generate TikTok post URL from user identifier and publish ID
 */
export function generateTikTokUrl (userIdentifier: string, _publishId?: string): string {
  const baseUrl = `https://www.tiktok.com/@${userIdentifier}`

  // If we have a publish ID, we could potentially construct a direct link
  // However, TikTok doesn't provide a direct way to get the final post URL
  // from the publish ID, so we return the user profile URL
  return baseUrl
}
