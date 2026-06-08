/** Format a date as a human relative string (e.g. `2 hours ago`). */
export function getHumanRelativeDate (date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - targetDate.getTime()

  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) return rtf.format(-diffYears, 'year')
  if (diffMonths > 0) return rtf.format(-diffMonths, 'month')
  if (diffWeeks > 0) return rtf.format(-diffWeeks, 'week')
  if (diffDays > 0) return rtf.format(-diffDays, 'day')
  if (diffHours > 0) return rtf.format(-diffHours, 'hour')
  if (diffMinutes > 0) return rtf.format(-diffMinutes, 'minute')
  return rtf.format(-diffSeconds, 'second')
}
