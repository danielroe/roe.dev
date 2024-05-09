export const serializers = new Map([
  [/\(\//g, '(https://roe.dev/'],
  [/ ---? /g, ' — '],
  [/::SocialPost\{link=([^ ]*)[\s\S]*?::/g, '$1'],
  [/:CalSchedule\{meeting=([^ ]*).*\}/g, 'https://cal.com/danielroe/$1'],
  [/(\n|^)---\n[\s\S]*\n---\n/, '\n'],
])
