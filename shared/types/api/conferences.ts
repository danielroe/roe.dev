/**
 * Conference logo resolved at request time, either from the record's own blob
 * or from the event site's `og:image`. All three fields are `null` when no
 * image could be resolved, and the dimensions are absent when the image was
 * served without parseable metadata.
 */
export interface UpcomingConferenceImage {
  url: string | null
  width?: number | null
  height?: number | null
}

/** Response payload item of `GET /api/upcoming-conferences`. */
export interface UpcomingConference {
  title?: string
  name: string
  /** Pre-formatted for display, e.g. `12 June` or `12 June - 14 June`. */
  dates: string
  link: string
  location: string
  image: UpcomingConferenceImage
}
