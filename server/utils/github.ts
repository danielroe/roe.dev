export const query = (accessToken: string, query: string) =>
  $fetch<{ data: any }>('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: { query },
  })
