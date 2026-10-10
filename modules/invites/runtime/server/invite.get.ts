import { createError, defineEventHandler, sendRedirect, useRuntimeConfig } from 'nuxt/server'
import type { RuntimeConfig } from 'nuxt/schema'

const CALLBACK_URL = import.meta.dev ? 'http://localhost:3000/auth/github' : 'https://roe.dev/auth/github'

export default defineEventHandler(event => {
  const config = useRuntimeConfig()
  const slug = event.url.pathname.slice(1)
  if (!config.invites?.map?.[slug as keyof RuntimeConfig['invites']['map']]) {
    throw createError({ status: 404 })
  }

  return sendRedirect(
    event,
    `https://github.com/login/oauth/authorize?client_id=${config.public.githubClientId}&redirect_uri=${CALLBACK_URL}/${slug}`,
    307,
  )
})
