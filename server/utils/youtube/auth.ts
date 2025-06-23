import type { H3Event } from 'h3'

interface YouTubeTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

interface YouTubeCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

export async function refreshYouTubeAccessToken (credentials: YouTubeCredentials): Promise<string> {
  const tokenUrl = 'https://oauth2.googleapis.com/token'

  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: 'refresh_token',
  })

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`YouTube token refresh failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const tokens: YouTubeTokenResponse = await response.json()

    if (!tokens.access_token) {
      throw new Error('YouTube token refresh failed: No access token returned')
    }

    return tokens.access_token
  }
  catch (error) {
    console.error('❌ Error refreshing YouTube token:', error)
    throw error
  }
}

export async function getValidYouTubeAccessToken (event: H3Event): Promise<string> {
  const config = useRuntimeConfig(event)

  // Check if we have a refresh token configured
  const refreshToken = config.youtube.refreshToken
  const clientId = config.youtube.clientId
  const clientSecret = config.youtube.clientSecret

  if (refreshToken && clientId && clientSecret) {
    // Use refresh token to get a fresh access token
    console.log('🔄 Refreshing YouTube access token...')

    const credentials: YouTubeCredentials = {
      clientId,
      clientSecret,
      refreshToken,
    }

    return await refreshYouTubeAccessToken(credentials)
  }

  throw new Error(
    'YouTube access not configured. Please set NUXT_YOUTUBE_REFRESH_TOKEN, NUXT_YOUTUBE_CLIENT_ID, and NUXT_YOUTUBE_CLIENT_SECRET.',
  )
}
