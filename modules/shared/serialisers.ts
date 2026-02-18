type Replacement = string | ((...args: string[]) => string)

export const serializers = new Map<RegExp, Replacement>([
  [/\(\//g, '(https://roe.dev/'],
  [/ ---? /g, ' — '],
  [/::(?:social-post|SocialPost)\{link=([^ ]*)(?:[^}]*)}\n([\s\S]*?)::/g, (_: string, link: string, body: string) => {
    const quoted = body.trim().split('\n').map((line: string) => `> ${line}`).join('\n')
    return `${quoted}\n>\n> — [source](${link})`
  }],
  [/:(?:cal-schedule|CalSchedule)\{meeting=([^ ]*).*\}/g, 'https://cal.com/danielroe/$1'],
  [/(\n|^)---\n[\s\S]*\n---\n/, '\n'],
])

/** Apply all serializers to a string. */
export function serialize (input: string): string {
  let result = input
  for (const [pattern, replacement] of serializers) {
    result = result.replace(pattern, replacement as string)
  }
  return result
}
