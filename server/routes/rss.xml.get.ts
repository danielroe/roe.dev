import { Feed } from 'feed'

// @ts-expect-error virtual file
import { metadata } from '#metadata.json'

export default defineEventHandler(async () => {
  if (!import.meta.dev && !import.meta.prerender) return

  const feed = new Feed({
    title: 'Daniel Roe',
    description: 'The personal website of Daniel Roe',
    feed: 'https://roe.dev/rss.xml',
    id: 'https://roe.dev/',
    link: 'https://roe.dev/blog',
    language: 'en',
    image: 'https://roe.dev/__og-image__/static/og.jpg',
    favicon: 'https://roe.dev/favicon.svg',
    copyright: `© 2019-${new Date().getFullYear()} Daniel Roe. All rights reserved.`,
    feedLinks: {
      json: 'https://roe.dev/feed/json',
      atom: 'https://roe.dev/feed/atom',
    },
    author: {
      name: 'Daniel Roe',
      email: 'daniel@roe.dev',
      link: 'https://roe.dev/',
    },
  })

  for (const slug in metadata) {
    const blog = metadata[slug]
    feed.addItem({
      title: blog.title,
      link: `https://roe.dev/blog/${slug}`,
      description: blog.description,
      content: blog.html.replace(/<img src="\//g, '<img src="https://roe.dev/'),
      category: blog.tags.map((tag: string) => ({ name: tag })),
      author: [
        {
          name: 'Daniel Roe',
          email: 'daniel@roe.dev',
          link: 'https://roe.dev',
        },
      ],
      date: new Date(blog.date),
      image: `https://roe.dev/__og-image__/static/blog/${slug}/og.jpg`,
    })
  }

  return feed.rss2()
})
