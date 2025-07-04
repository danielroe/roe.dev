export default defineEventHandler(async event => {
  const sanity = useSanity(event)

  // Always return past talks with titles (for sync and display)
  const groqQuery = `*[_type == "talk" && date < now() && defined(title) && title != ""] {
    _id,
    title,
    description,
    date,
    endDate,
    source,
    location,
    type,
    episode,
    tags,
    link,
    video,
    slides,
    demo,
    repo,
    "group": group->{
      _id,
      title,
      description
    },
    image
  } | order(date desc)`

  try {
    const talks = await sanity.client.fetch(groqQuery)
    return talks
  }
  catch (error) {
    console.error('Failed to fetch talks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch talks',
    })
  }
})
