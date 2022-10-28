const normalizeVercelResponse = async (r: unknown) =>
  process.client && r instanceof Blob ? JSON.parse(await r.text()) : r

export const useAsyncHome = () =>
  useAsyncData(
    () =>
      ((process.server || process.dev) as true) &&
      queryContent('/')
        .only(['title', 'type', 'body'])
        .findOne()
        .then(normalizeVercelResponse)
  )

export const useAsyncUses = () =>
  useAsyncData(
    () =>
      ((process.server || process.dev) as true) &&
      queryContent('/uses')
        .only(['title', 'type', 'body'])
        .findOne()
        .then(normalizeVercelResponse)
  )

export const useAsyncBlogIndex = () =>
  useAsyncData(
    () =>
      ((process.server || process.dev) as true) &&
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
export const useAsyncTalks = () =>
  useAsyncData(
    () =>
      (
        ((process.server || process.dev) as true) &&
        import('../data/talks.json').then(r => r.default)
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

export const useAsyncBlogArticle = (path: string) =>
  useAsyncData(
    path,
    () =>
      ((process.server || process.dev) as true) &&
      queryContent(path)
        .only(['title', 'type', 'body', 'date', 'tags'])
        .findOne()
        .then(normalizeVercelResponse)
  )
