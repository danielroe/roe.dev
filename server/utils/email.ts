export function sendEmail (subject: string, body: string) {
  return $fetch('https://api.resend.com/email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${useRuntimeConfig().resendApiKey}`,
    },
    body: {
      subject,
      text: body,
      from: 'noreply@roe.dev',
      to: 'daniel@roe.dev',
    },
  })
}
