const redirect = process.dev
  ? '&redirect_uri=http://localhost:3000/auth/github/cityjs'
  : '&redirect_uri=https://roe.dev/auth/github/cityjs'

const config = useRuntimeConfig()
const loginURL = `https://github.com/login/oauth/authorize?client_id=${config.public.githubClientId}${redirect}`

export default defineEventHandler(async event => {
  await sendRedirect(event, loginURL)
})
