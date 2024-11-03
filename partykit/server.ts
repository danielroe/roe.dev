import type { PartyKitServer, Room } from 'partykit/server'

export default {
  async onConnect (ws, party) {
    // 1. handle live voting in slide deck
    const setCount = async (val: number) => {
      await party.storage.put('count', val)
      ws.send(`count:${val}`)
    }

    ws.send(`count:${await getCount(party)}`)
    ws.addEventListener('message', async ({ data }) => {
      if (data === 'vote') await setCount((await getCount(party)) + 1)
      if (data === 'clear') await setCount(0)
      if (data === 'clear' && party.id === 'feedback') {
        await party.storage.put('feedback', [])
        ws.send(`feedback:[]`)
      }
    })

    // 2. let everyone know someone new is viewing the site
    party.broadcast(`connections:${[...party.getConnections()].length}`)

    if (party.id === 'feedback') {
      ws.send(`feedback:${JSON.stringify(await party.storage.get('feedback') || [])}`)
    }

    // 3. let people know if I'm streaming
    ws.send(`status:${(await party.storage.get('status')) || 'default'}`)
  },
  async onRequest (request, party) {
    if (request.method !== 'POST')
      return new Response('Invalid request', { status: 422 })

    const body = await request.text().then(r => (r ? JSON.parse(r) : {}))
    const { status, type = status ? 'status' : 'vote' } = body as {
      type?: 'vote' | 'status' | 'feedback'
      status?: string
    }

    // 4. allow one-off live voting via link
    if (type === 'vote') {
      const val = (await getCount(party)) + 1
      await party.storage.put('count', val)
      party.broadcast(`count:${val}`)
      return new Response(null, { status: 204 })
    }

    // 5. allow one-off live voting via link
    if (type === 'feedback') {
      await party.storage.transaction(async tx => {
        const feedback = await tx.get<string[]>('feedback') || []
        feedback.push(status!)
        await tx.put('feedback', feedback)
        party.broadcast(`feedback:${JSON.stringify(feedback)}`)
      })
      return new Response(null, { status: 204 })
    }

    // 6. tell people if I'm going live
    if (type === 'status') {
      if (!status || !['live', 'default'].includes(status))
        return new Response('Invalid status', { status: 422 })

      if (request.headers.get('authorization') !== party.env.PARTYKIT_TOKEN)
        return new Response('Unauthorised', { status: 401 })

      party.storage.put('status', status)
      party.broadcast(`status:${status}`)
      return new Response(null, { status: 204 })
    }

    return new Response('Invalid request', { status: 422 })
  },
} satisfies PartyKitServer

const getCount = (room: Room) => room.storage.get<number>('count').then(r => r || 0)
