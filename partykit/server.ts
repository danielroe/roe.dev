import type { PartyKitServer, Party } from 'partykit/server'

export default {
  async onConnect(ws, room) {
    const set = async (val: number) => {
      await room.storage.put('count', val)
      ws.send(`count:${val}`)
    }

    ws.send(`count:${await get(room)}`)
    ws.addEventListener('message', async ({ data }) => {
      if (data === 'vote') {
        await set((await get(room)) + 1)
      }
      if (data === 'clear') {
        await set(0)
      }
    })
  },
  async onRequest(request, room) {
    if (request.method === 'GET') {
      return new Response(String(await get(room)), { status: 200 })
    }
    if (request.method === 'POST') {
      const val = (await get(room)) + 1
      await room.storage.put('count', val)
      room.broadcast(`count:${val}`)
      return new Response(null, { status: 204 })
    }
    return new Response('Invalid request', { status: 422 })
  },
} satisfies PartyKitServer

const get = (room: Party) => room.storage.get<number>('count').then(r => r || 0)
