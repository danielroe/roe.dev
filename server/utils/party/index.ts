import process from 'node:process'
import { useRuntimeConfig } from 'nuxt/server'

import { createParty } from './server'
import type { Party } from './server'
import { usePartyStore } from './store'

let party: Promise<Party> | undefined

export function useParty () {
  return party ||= usePartyStore().then(store => {
    const { token } = useRuntimeConfig().party
    return createParty({
      store,
      authorise: candidate => token ? candidate === token : !!import.meta.dev,
      prefix: `${process.env.VERCEL_ENV || 'development'}:`,
    })
  }, err => {
    party = undefined
    throw err
  })
}
