const URL_PATTERN
  = /\b((?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,24}\/[^\s<]*)/gi

const TRAILING_PUNCTUATION = /[)\].,;:!?'"]+$/

function balanceTrailing (url: string): { url: string, trailing: string } {
  let trailing = ''
  let current = url
  while (true) {
    const match = current.match(TRAILING_PUNCTUATION)
    if (!match) break
    const candidate = current.slice(0, -match[0].length)
    const opens = (candidate.match(/\(/g) || []).length
    const closes = (candidate.match(/\)/g) || []).length
    if (match[0].includes(')') && opens > closes) break
    trailing = match[0] + trailing
    current = candidate
  }
  return { url: current, trailing }
}

function toHref (raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

/**
 * Wrap bare URLs and domain-like tokens in Mastodon-style HTML with `<a>` tags,
 * leaving any text already inside an `<a>` element untouched.
 *
 * Mastodon only auto-links text that starts with a protocol; references like
 * `roe.dev/ama` stay as plain text in the rendered `content` field.
 */
export function linkifyBareUrls (html: string): string {
  let result = ''
  let cursor = 0
  const anchor = /<a\b[^>]*>[\s\S]*?<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = anchor.exec(html))) {
    result += linkifyText(html.slice(cursor, match.index))
    result += match[0]
    cursor = match.index + match[0].length
  }
  result += linkifyText(html.slice(cursor))
  return result
}

function linkifyText (segment: string): string {
  if (!segment) return segment
  return segment.replace(URL_PATTERN, raw => {
    const { url, trailing } = balanceTrailing(raw)
    return `<a href="${toHref(url)}">${url}</a>${trailing}`
  })
}
