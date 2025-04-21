export const query = (accessToken: string, query: string) =>
  fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${accessToken}`,
      'user-agent': 'roe (https://roe.dev, 0.1)',
    },
    body: JSON.stringify({ query }),
  })
    .then(r => r.json() as Promise<{ data: any }>)
    .then(r => {
      if ('errors' in r) {
        throw r
      }
      return r.data
    })
