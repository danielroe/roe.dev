/**
 * @type {(haystack: string, needle: string | RegExp, index: number ) => string} getMatchOrReturn
 */
export function getMatchOrReturn(haystack, needle, index = 0) {
  const matches = haystack.match(needle)
  if (!matches || !matches.length || matches.length < index + 1) return ''
  return matches[index]
}
