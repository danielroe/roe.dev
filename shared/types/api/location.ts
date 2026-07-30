/** Response payload of `GET /api/current-location`. */
export interface CurrentLocation {
  meetupAvailable: boolean
  city: string
  /** Sub-region for countries with verbose ISO 3166 names, country otherwise. */
  area: string
  flagEmoji: string
}
