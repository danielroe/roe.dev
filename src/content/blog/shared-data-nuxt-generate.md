---
title: 'Using shared data when generating pages'
date: '2023-12-30T22:00:00.000Z'
tags:
  - nuxt
  - generate
description: You may have loved the shared 'payload' feature when generating Nuxt 2 apps. But did you know you can do the same in Nuxt 3?
---

You may have loved the shared 'payload' feature when generating Nuxt 2 apps. But did you know you can do the same in Nuxt 3?

## Why use a shared 'payload'?

Rather than running the same code over and over again (for example, for every page of a blog that fetches some data from a CMS), you can perform the step once and share the data across all the generated pages.

As the time taken to generate static pages slows down every deploy, if you can extract this step and _share_ the data across successive page prerendering, it can _significantly_ speed up the deployment process.

## Using a shared payload in Nuxt 2

In Nuxt 2, you would [use a shared payload (see docs)](https://v2.nuxt.com/docs/configuration-glossary/configuration-generate#speeding-up-dynamic-route-generation-with-payload) like this:

<div>~/nuxt.config.ts</div>

```ts
import axios from 'axios'

export default {
  generate: {
    routes() {
      return axios.get('https://my-api/users').then(res => {
        return res.data.map(user => {
          return {
            route: '/users/' + user.id,
            payload: user
          }
        })
      })
    }
  }
}
```

This payload then becomes part of the Nuxt context, accessible (for example) in your data fetching hooks:

```ts
export default {
  async asyncData ({ params, payload }) {
    if (payload) return { user: payload }
    else return { user: await fetchUser(params.id) }
  }
}
```

## Using a shared payload in Nuxt 3

When we released Nuxt 3, we didn't document a successor to the payload functionality in Nuxt 2. That is for two reasons:

1. **We want the `nuxt.config` to be fully serialisable**. Ideally it shouldn't contain much (if any) code that couldn't fit in a normal JSON object. (And _zero_ runtime code.) That has already unlocked future capabilities for us including the ability to have an entirely self-contained `.output/` folder for Nuxt builds.

2. **We already support a much more powerful _storage_ layer**. It's possible with a very few steps to duplicate this functionality in a much more granular and customised way, with [the shared storage layer we've built into Nitro](https://nitro.unjs.io/guide/storage).

Before I share an example of how you might do that yourself, note that there's already a module to make this much easier: [**nuxt-prepare**](https://nuxt-prepare.byjohann.dev) by Johann Schopplich.

But if you wanted to build this yourself, here's how you might do it:

<div>~/server/plugijns/payload.ts</div>

```ts
const getPayload = dedupe(
  cache('payload', async () => {
    console.log('[nuxt] initialising payload')
    return {
      todos: await $fetch('https://jsonplaceholder.typicode.com/todos'),
    }
  })
)

export default defineNitroPlugin((nitroApp) => {
  // expose payload to each request if we are prerendering
  nitroApp.hooks.hook('request', async (event) => {
    event.context.payload = import.meta.prerender ? await getPayload() : {}
  })
})

// avoid duplicating calls in parallel as prerender process
// calls a number of renders at the same time, before the
//  first payload is initialised
function dedupe<T>(fn: () => Promise<T>) {
  let promise: Promise<T>
  return () => {
    return (promise ||= fn())
  }
}

// cache result in memory by default - though
// we could also cache it in data store:
// 👉 https://github.com/unjs/nitro/pull/1352
function cache<T>(key: string, fn: () => Promise<T>) {
  const data = useStorage()
  return async () => {
    let value = await data.getItem<any>(key)
    if (!value) {
      value = await fn()
      await data.setItem(key, value)
    }
    return value
  }
}
```

This approach uses Nitro's storage layer to store data between prerendered routes, running in a Nitro server plugin. You could then use this shared payload in a Vue component (or Nuxt plugin) like this:

```ts
const event = useRequestEvent()
const { data } = await useAsyncData(async () => {
  if (import.meta.prerender) {
    return event.context.payload.todos
  }
  if (!import.meta.dev) {
    throw new Error('this should only hit this condition in development')
  }
  console.log('fetching data in dev mode')
  return await $fetch('https://jsonplaceholder.typicode.com/todos')
})
```

This approach uses `import.meta.prerender` which allows us to _tree-shake_ code out of our builds so you only include this payload code in your app when you are prerendering your app.

This also relies on payload extraction, which is a feature Nuxt turns on by default when you prerender pages, which means that your data fetching composables (`useFetch` and `useAsyncData`) can reuse the data they produced at the prerender stage rather than running again on the client when you navigate to them.

If you are prerendering every route of your app, you can also confidently early return or throw an error which means your data fetching code also be tree shaken out from your final app. (That's what I do in my website: [see here](https://github.com/danielroe/roe.dev/blob/main/src/components/TheTalks.server.vue#L37-L38) for example.)

You can check out this [full StackBlitz example](https://stackblitz.com/edit/nuxt-shared-payload?file=server/plugins/payload.ts) - make sure to run `pnpm generate` to confirm that the console log only runs when the first page is prerendered.

## Next steps for prerendering optimisations

👉 We're already talking about how to make this easier for users (and even automatic!). Follow [pull request #24894](https://github.com/nuxt/nuxt/pull/24894) for our thoughts and implementation.
