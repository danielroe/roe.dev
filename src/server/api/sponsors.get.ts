import { getSponsors } from '../utils/sponsors'

export default defineCachedEventHandler(
  () => getSponsors().then(r => r.map(s => s.avatarUrl).filter(Boolean)),
  { maxAge: 60 }
)
