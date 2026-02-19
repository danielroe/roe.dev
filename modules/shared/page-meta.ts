export interface PageMeta {
  title: string
  description?: string
  /** Short label used in llms.txt page index. Pages without this are excluded from llms.txt. */
  llmLabel?: string
}

export const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: 'Daniel Roe',
    description: 'The personal website of Daniel Roe, Nuxt core team lead',
  },
  '/ai': {
    title: 'AI Usage',
    llmLabel: 'How Daniel uses AI',
  },
  '/ama': {
    title: 'Ask me anything',
  },
  '/bio': {
    title: 'Bio',
    description: 'Biography of Daniel Roe',
    llmLabel: 'Full biography',
  },
  '/blog': {
    title: 'Blog',
    description: 'Blog posts by Daniel Roe',
    llmLabel: 'All blog posts',
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
    llmLabel: 'Conference talks and podcasts',
  },
  '/uses': {
    title: 'Uses',
    description: 'Tools, software, and hardware that Daniel Roe uses',
    llmLabel: 'Tools and software',
  },
  '/voted': {
    title: 'Thank you!',
  },
  '/work': {
    title: 'Work',
    description: 'Open source projects and past client work by Daniel Roe',
    llmLabel: 'Open source projects and past client work',
  },
}
