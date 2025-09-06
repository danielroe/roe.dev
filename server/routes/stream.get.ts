const BOT_RE = /bot\b|index|spider|facebookexternalhit|crawl|wget|slurp|mediapartners-google|whatsapp|twitter|linkedin|mastodon|bluesky|bsky/i

export default defineEventHandler(async event => {
  setHeader(event, 'vary', 'user-agent')

  const userAgent = getRequestHeader(event, 'user-agent')
  const isOpenGraphCrawler = userAgent && BOT_RE.test(userAgent)
  if (!isOpenGraphCrawler) {
    return await sendRedirect(event, 'https://twitch.tv/danielroe')
  }

  setHeader(event, 'content-type', 'text/html')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=https://twitch.tv/danielroe">
  <title>Daniel Roe live stream</title>
  <meta name="description" content="Join me live on Twitch.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://roe.dev/stream">
  <meta property="og:title" content="Daniel Roe live stream">
  <meta property="og:description" content="Join me live on Twitch.">
  <meta property="og:image" content="https://roe.dev/stream.jpg">
  <meta property="og:image:alt" content="Daniel Roe Live Stream">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://roe.dev/stream">
  <meta name="twitter:title" content="Daniel Roe live stream">
  <meta name="twitter:description" content="Join me live on Twitch.">
  <meta name="twitter:image" content="https://roe.dev/img/stream-og.jpg">
</head>
<body>
  <script>window.location.href = 'https://twitch.tv/danielroe'</script>
</body>
</html>`
})
