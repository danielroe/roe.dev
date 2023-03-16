const $fetch = (url: string, body: Record<string, any>) =>
  fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${useRuntimeConfig().resendApiKey}`,
      'Content-Type': 'application/json',
    },
  })

export function sendEmail(subject: string, body: string) {
  return $fetch('https://api.resend.com/email', {
    subject,
    html: body,
    from: 'noreply@roe.dev',
    to: 'daniel@roe.dev',
  })
}
