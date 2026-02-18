export interface PageMeta {
  title: string
  description?: string
}

export const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: 'Daniel Roe',
    description: 'The personal website of Daniel Roe, Nuxt core team lead',
  },
  '/ai': {
    title: 'AI Usage',
  },
  '/ama': {
    title: 'Ask me anything',
  },
  '/bio': {
    title: 'Bio',
    description: 'Biography of Daniel Roe',
  },
  '/blog': {
    title: 'Blog',
    description: 'Blog posts by Daniel Roe',
  },
  '/feed': {
    title: 'Feed',
  },
  '/feedback': {
    title: 'Feedback',
  },
  '/live': {
    title: 'Live Reactions',
  },
  '/talks': {
    title: 'Talks',
    description: 'Talks and presentations by Daniel Roe',
  },
  '/uses': {
    title: 'Uses',
    description: 'Tools, software, and hardware that Daniel Roe uses',
  },
  '/voted': {
    title: 'Thank you!',
  },
  '/work': {
    title: 'Work',
    description: 'Open source projects and past client work by Daniel Roe',
  },
}
