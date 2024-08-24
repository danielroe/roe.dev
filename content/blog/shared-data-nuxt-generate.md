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

First, what is a shared payload - and why would you want it?

Rather than running the same code over and over again (for example, for every page of a blog that fetches some data from a CMS), you can perform the step once and share the data across all the generated pages.

For example, if they are used on more than one page, you might want to extract and share data like a list of breadcrumbs, or a list of blog posts, or even the social links in the footer of your site.

As the time taken to generate static pages slows down every deploy, if you _share_ this data across successive page prerendering, it can _significantly_ speed up the deployment process and decrease the number of hits on your content management system.

## Using a shared payload in Nuxt 2

In Nuxt 2, shared payload support was built in. You could use a shared payload as simply as this ([see Nuxt 2 documentation](https://v2.nuxt.com/docs/configuration-glossary/configuration-generate/#speeding-up-dynamic-route-generation-with-payload)):

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

This 'payload' then becomes part of the Nuxt context, accessible (for example) in your data fetching hooks:

```ts
export default {
  async asyncData ({ params, payload }) {
    if (payload) return { user: payload }
    else return { user: await fetchUser(params.id) }
  }
}
```

## Using a shared payload in Nuxt 3

When we released Nuxt 3, we didn't document a successor to this shared payload functionality in Nuxt 2.

👉 **Note** that we also use the word 'payload' to refer to everything we transfer from the server to the client in Nuxt 3, so I've tried to use 'shared payload' consistently here - but be aware that if you're reading old articles it might be confusing.

We didn't directly port this feature across to Nuxt 3 for two reasons:

1. **We want the `nuxt.config` to be fully serialisable**. Ideally it shouldn't contain much (if any) code that couldn't fit in a normal JSON object. (And _zero_ runtime code.) That has already unlocked future capabilities for us including the ability to have an entirely self-contained `.output/` folder for Nuxt builds.

1. More significantly, **we already support a much more powerful _storage_ layer**. It's possible with a very few steps to duplicate this functionality in a much more granular and customised way, with [the shared storage layer we've built into Nitro](https://nitro.unjs.io/guide/storage).

Before I share an example of how you might do that yourself, I should say that there's a module to make this much easier: [**nuxt-prepare**](https://nuxt-prepare.byjohann.dev) by Johann Schopplich. Check it out!

But if you wanted to build this yourself, here's how you might do it. This approach uses Nitro's storage layer to store data between prerendered routes, running in a Nitro server plugin:

<div>~/server/plugins/payload.ts</div>

```ts
const getPayload = dedupe(cache('payload', async () => ({
  todos: await $fetch('https://jsonplaceholder.typicode.com/todos'),
})))

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

You could then use this shared payload in a Vue component (or Nuxt plugin) like this:

```ts
const event = useRequestEvent()
const { data } = await useAsyncData(async () => {
  if (import.meta.prerender) {
    return event.context.payload.todos
  }
  return await $fetch('https://jsonplaceholder.typicode.com/todos')
})
```

This approach uses `import.meta.prerender`, which allows us to _tree-shake_ code out of our builds so you only include this payload code in your app when you are prerendering your app. (In the example above it's quite minimal, but it's worth being aware of in your own projects to optimise your bundle size.)

You can check out this [full StackBlitz example](https://stackblitz.com/edit/nuxt-shared-payload?file=server/plugins/payload.ts) - make sure to run `pnpm generate` to confirm that the console log only runs when the first page is prerendered.

## Payload extraction

It gets even better. Nuxt turns on something called 'payload extraction' when you prerender your pages. (You can also turn it on manually even when you have a runtime server, with the `experimental.payloadExtraction` option.) 

Without payload extraction, your data fetching composables (`useFetch` and `useAsyncData`) will rerun on _client-side_ navigation. But _with_ it, this data is extracted into a `payload.json` file which can be used instead of rerunning the composables.

If you are prerendering every route of your app, you can therefore confidently early return or throw an error which means your data fetching code can also be tree shaken out from your final app. (That's what I do in my website: [see here](https://github.com/danielroe/roe.dev/blob/main/src/components/TheTalks.server.vue#L37-L38) for example.)

## Next steps for prerendering optimisations

👉 In addition to **nuxt-prepare**, we're already talking about how to make this easier for users (and automatic!). Follow [pull request #24894](https://github.com/nuxt/nuxt/pull/24894) for our thoughts and implementation.
