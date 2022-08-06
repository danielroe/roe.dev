const normalizeVercelResponse = async (r: unknown) =>
  process.client && r instanceof Blob ? JSON.parse(await r.text()) : r

export const usePageData = (path = useRoute().path) => {
  path = path.replace(/(index)?\.json$/, '')
  switch (path) {
    case '/':
      return useAsyncHome()
    case '/work':
      return
    case '/talks':
      return useAsyncTalks()
    case '/blog':
      return useAsyncBlogIndex()
    case '/uses':
      return useAsyncUses()
    default:
      return useAsyncBlogArticle(path)
  }
}

const useAsyncHome = () =>
  useAsyncData(
    'home',
    () =>
      process.server &&
      queryContent('/')
        .only(['title', 'type', 'body'])
        .findOne()
        .then(normalizeVercelResponse)
  )

const useAsyncUses = () =>
  useAsyncData(
    'uses',
    () =>
      process.server &&
      queryContent('/uses')
        .only(['title', 'type', 'body'])
        .findOne()
        .then(normalizeVercelResponse)
  )

const useAsyncBlogIndex = () =>
  useAsyncData(
    'blog',
    () =>
      process.server &&
      queryContent('/blog')
        .only(['title', 'date', '_path'])
        .find()
        .then(async r =>
          process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
        ),
    {
      transform: (
        result: Array<{ title: string; date: string; _path: string }>
      ) => {
        return result
          .map(e => ({
            ...formatDateField(e),
            path: e._path,
          }))
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
      },
    }
  )

interface Talk {
  title: string
  source: string
  tags: string
  link: string
  date: string
  formattedDate: string
}
const useAsyncTalks = () =>
  useAsyncData(
    'talks',
    () =>
      (
        process.server && import('../content/talks.json').then(r => r.default)
      ).then(async r =>
        process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
      ) as unknown as Promise<Talk[]>,
    {
      transform: talks => {
        return (
          (talks
            ?.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .map(formatDateField) as Talk[]) || []
        )
      },
    }
  )

const useAsyncBlogArticle = (path: string) =>
  useAsyncData(
    path,
    () =>
      process.server &&
      queryContent(path)
        .only(['title', 'type', 'body', 'date', 'tags'])
        .findOne()
        .then(normalizeVercelResponse)
  )
