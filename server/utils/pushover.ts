import type { H3Event } from 'h3'

export interface PushoverOptions {
  title: string
  message: string
  priority?: -2 | -1 | 0 | 1 | 2
  url?: string
  urlTitle?: string
}

export function sendPushoverNotification (event: H3Event, options: PushoverOptions) {
  const config = useRuntimeConfig(event)

  if (!config.pushover.token || !config.pushover.userKey) {
    console.warn('Pushover credentials not configured')
    return Promise.resolve()
  }

  return $fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: {
      token: config.pushover.token,
      user: config.pushover.userKey,
      title: options.title,
      message: options.message,
      priority: String(options.priority ?? 0),
      ...(options.url && { url: options.url }),
      ...(options.urlTitle && { url_title: options.urlTitle }),
    },
  })
}
