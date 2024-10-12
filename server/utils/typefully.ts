import type { H3Event } from 'h3'

export async function createTypefullyDraft (event: H3Event, text: string) {
  const content = `
${text}

https://roe.dev/ama

#ama`
  return await $fetch('/drafts/', {
    baseURL: 'https://api.typefully.com/v1',
    method: 'POST',
    headers: {
      'X-API-KEY': useRuntimeConfig(event).typefully.apiKey,
    },
    body: {
      content,
    },
  })
}
