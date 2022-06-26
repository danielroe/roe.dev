export const usePageData = (path = useRoute().path) => {
  switch (path) {
    case '/':
      return useAsyncHome()
    case '/work':
      return
    case '/talks':
      return useAsyncTalks()
    case '/blog':
      return useAsyncBlogIndex()
    default:
      return useAsyncBlogArticle(path)
  }
}

const useAsyncHome = () =>
  useAsyncData('home', () =>
    queryContent('/')
      .only(['title', 'type', 'body'])
      .findOne()
      .then(async r =>
        process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
      )
  )

const useAsyncBlogIndex = () =>
  useAsyncData(
    'blog',
    () =>
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
  name: string
  type: string
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
      queryContent('/talks')
        .only(['title', 'source', 'link', 'date', 'formattedDate'])
        .find()
        .then(async r =>
          process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
        ) as unknown as Promise<Talk[]>,
    {
      transform: talks => {
        talks?.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        return (talks?.map(formatDateField) as Talk[]) || []
      },
    }
  )

const useAsyncBlogArticle = (path: string) =>
  useAsyncData(path, () =>
    queryContent(path)
      .only(['title', 'type', 'body', 'date', 'tags'])
      .findOne()
      .then(async r =>
        process.client && r instanceof Blob ? JSON.parse(await r.text()) : r
      )
  )
