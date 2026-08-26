export const SITE_URL = 'https://roe.dev'

/** The `YYYY-MM-DD` portion of an ISO date, as used in markdown frontmatter and listings. */
export function isoDate (value: string | Date): string {
  return (typeof value === 'string' ? value : value.toISOString()).slice(0, 10)
}
