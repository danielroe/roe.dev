const $fetch = (url: string, body: Record<string, any>) =>
  fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${useRuntimeConfig().sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
  })

const sender = { email: 'noreply@poetry.sh', name: 'Me' }
const recipient = { email: 'daniel@roe.dev', name: 'Daniel Roe' }

export function sendEmail (subject: string, body: string) {
  return $fetch('https://api.sendgrid.com/v3/mail/send', {
    personalizations: [{ to: [recipient], subject }],
    content: [{ type: 'text/plain', value: body }],
    from: sender,
    reply_to: sender,
  })
}
