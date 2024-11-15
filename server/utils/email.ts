import type { H3Event } from 'h3'

export function sendEmail (event: H3Event, subject: string, body: string) {
  return $fetch('https://api.resend.com/email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${useRuntimeConfig(event).resendApiKey}`,
    },
    body: {
      subject,
      text: body,
      from: 'noreply@roe.dev',
      to: 'daniel@roe.dev',
    },
  })
}
