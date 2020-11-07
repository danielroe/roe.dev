import { IncomingMessage } from 'http'

import { getMatchOrReturn } from '../scripts/global'

import { metadata } from './metadata.json'

export interface ParsedReqs {
  title: string
  date: string
  tags: string[]
}

export function parseReqs(req: IncomingMessage) {
  const slug = getMatchOrReturn(req.url || '', /\/([^/]*).jpg$/, 1)

  if (slug === 'og') {
    return {
      date: '',
      title: 'roe.dev',
      tags: [],
    }
  }
  const { title, date, tags = [] } = (metadata as Record<string, any>)[slug]

  if (!title || !date) {
    throw new Error('No data found.')
  }

  const parsedReqs: ParsedReqs = {
    date,
    title,
    tags,
  }

  console.log(JSON.stringify(parsedReqs))

  return parsedReqs
}
