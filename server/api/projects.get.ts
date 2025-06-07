export default defineEventHandler(async event => {
  const sanity = useSanity(event)

  const projects = await sanity.client.fetch(`
    *[_type == "project" && isPrivate != true] | order(isFeatured desc, order asc, name asc) {
      _id,
      name,
      slug,
      description,
      logo,
      githubRepo,
      category,
      isPrivate,
      isFeatured,
      links,
      tags,
      order,
      syncedAt
    }
  `)

  return projects
})
