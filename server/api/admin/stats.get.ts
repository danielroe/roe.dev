import { requireAdminAirspace } from '../../utils/airspace'

export default defineEventHandler(async event => {
  const airspace = await requireAdminAirspace(event)

  const [talks, talkGroups, usesCategories, usesItems, projectCategories, projects, location] = await Promise.all([
    airspace.talks.list(),
    airspace.talkGroups.list(),
    airspace.usesCategories.list(),
    airspace.usesItems.list(),
    airspace.projectCategories.list(),
    airspace.projects.list(),
    airspace.location.get(),
  ])

  return {
    talks: talks.length,
    talkGroups: talkGroups.length,
    usesCategories: usesCategories.length,
    usesItems: usesItems.length,
    projectCategories: projectCategories.length,
    projects: projects.length,
    hasLocation: !!location,
  }
})
