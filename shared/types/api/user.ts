/** Response payload of `GET /api/user`. */
export interface SessionUser {
  authenticated: boolean
  sponsor: boolean
  avatar?: string
  name?: string
}
