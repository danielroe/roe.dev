import { Feed } from 'feed'

export default defineEventHandler(async () => {
  if (!import.meta.dev && !import.meta.prerender) return

  const feed = new Feed({
    title: 'Daniel Roe',
    description: 'The personal website of Daniel Roe',
    feed: 'https://roe.dev/rss.xml',
    id: 'https://roe.dev/',
    link: 'https://roe.dev/blog',
    language: 'en',
    image: 'https://roe.dev/_og/s/og.png',
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

  for (const post of blogPosts()) {
    const published = new Date(post.data.date)

    feed.addItem({
      title: post.data.title,
      link: `https://roe.dev${post.path}`,
      description: post.data.description,
      content: post.meta.html?.replace(/<img src="\//g, '<img src="https://roe.dev/'),
      category: post.data.tags.map(tag => ({ name: tag })),
      author: [
        {
          name: 'Daniel Roe',
          email: 'daniel@roe.dev',
          link: 'https://roe.dev',
        },
      ],
      // feed items are dated to local midnight rather than the time of day the post was published
      date: new Date(published.getFullYear(), published.getMonth(), published.getDate()),
      image: `https://roe.dev/_og/s${post.path}/og.png`,
    })
  }

  return feed.rss2()
})
