import { IncomingMessage } from 'http'

import { getMatchOrReturn } from '../src/utils/global'

import { metadata } from './metadata.json'

export interface ParsedReqs {
  title: string
  date: string
}

export function parseReqs(req: IncomingMessage) {
  const slug = getMatchOrReturn(req.url || '', /\/([^/]*).jpg$/, 1)

  if (slug === 'og') {
    return {
      date: '',
      title: 'roe.dev',
    }
  }
  const { title, date } = (metadata as Record<string, any>)[slug]

  if (!title || !date) {
    throw new Error('No data found.')
  }

  const parsedReqs: ParsedReqs = {
    date,
    title,
  }

  console.log(JSON.stringify(parsedReqs))

  return parsedReqs
}
