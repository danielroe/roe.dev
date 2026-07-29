/**
 * Response payload item of `GET /api/streams`. This is Twitch's `helix/videos`
 * shape passed through unchanged, so the field names are theirs.
 */
export interface Stream {
  created_at: string
  description: string
  duration: string
  id: string
  language: string
  muted_segments: null
  published_at: string
  stream_id: string
  /** Contains `%{width}` / `%{height}` placeholders that callers substitute. */
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
