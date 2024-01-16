export default defineCachedEventHandler(async () => {
  // @ts-expect-error added in config
  if (import.meta.test) return []

  const config = useRuntimeConfig()
  const token = await $fetch<TwitchTokenResponse>(
    'https://id.twitch.tv/oauth2/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${config.twitch.clientId}&client_secret=${config.twitch.clientSecret}&grant_type=client_credentials`,
    }
  )

  const videos: TwitchVideo[] = []
  let batch: TwitchDataResponse<TwitchVideo[]> | undefined
  do {
    batch = await $fetch<TwitchDataResponse<TwitchVideo[]>>('/videos', {
      baseURL: 'https://api.twitch.tv/helix',
      query: {
        user_id: '489621500',
        type: 'archive',
        after: batch?.pagination?.cursor,
      },
      headers: {
        'Client-ID': config.twitch.clientId,
        Authorization: `Bearer ${token.access_token}`,
      },
    })
    videos.push(...batch.data)
  } while (batch.pagination?.cursor)

  return videos
})

interface TwitchVideo {
  created_at: string
  description: string
  duration: string
  id: string
  language: string
  muted_segments: null
  published_at: string
  stream_id: string
  thumbnail_url: string
  title: string
  type: string
  url: string
  user_id: string
  user_login: string
  user_name: string
  view_count: number
  viewable: string
}

interface TwitchDataResponse<T> {
  data: T
  pagination: { cursor?: string }
}

interface TwitchTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}
