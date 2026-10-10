import { defineEventHandler } from 'nuxt/server'

export default defineEventHandler(event => contentPageResponse(event, '/ai'))
