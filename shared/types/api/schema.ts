import type { Endpoint } from 'fetchdts'

import type { Talk } from '../../cms/talks.ts'
import type { UsesCategory } from '../../cms/uses.ts'
import type { UpcomingConference } from './conferences.ts'
import type { CurrentLocation } from './location.ts'
import type { Stream } from './streams.ts'
import type { SessionUser } from './user.ts'

/**
 * Route tree for the public API, consumed by `apiFetch` / `useApiFetch`.
 */
export interface PublicApi {
  '/api/current-location': {
    [Endpoint]: {
      GET: { response: CurrentLocation | null }
    }
  }
  '/api/upcoming-conferences': {
    [Endpoint]: {
      GET: { response: UpcomingConference[] }
    }
  }
  '/api/streams': {
    [Endpoint]: {
      GET: { response: Stream[] }
    }
  }
  '/api/talks': {
    [Endpoint]: {
      GET: { response: Talk[] }
    }
  }
  '/api/uses': {
    [Endpoint]: {
      GET: { response: UsesCategory[] }
    }
  }
  '/api/sponsors': {
    [Endpoint]: {
      GET: { response: string[] }
    }
  }
  '/api/user': {
    [Endpoint]: {
      GET: { response: SessionUser }
    }
  }
  '/api/question': {
    [Endpoint]: {
      POST: { body: { question: string }, response: null }
    }
  }
  '/api/feedback': {
    [Endpoint]: {
      POST: { body: { feedback: string }, response: null }
    }
  }
}
