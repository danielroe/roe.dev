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

  if (diffYears > 0) {
    return rtf.format(-diffYears, 'year')
  }
  else if (diffMonths > 0) {
    return rtf.format(-diffMonths, 'month')
  }
  else if (diffWeeks > 0) {
    return rtf.format(-diffWeeks, 'week')
  }
  else if (diffDays > 0) {
    return rtf.format(-diffDays, 'day')
  }
  else if (diffHours > 0) {
    return rtf.format(-diffHours, 'hour')
  }
  else if (diffMinutes > 0) {
    return rtf.format(-diffMinutes, 'minute')
  }
  else {
    return rtf.format(-diffSeconds, 'second')
  }
}
