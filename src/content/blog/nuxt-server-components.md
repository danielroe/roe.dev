---
title: 'A guide to Nuxt server components'
date: '2023-07-23T14:00:00.000Z'
tags:
  - nuxt
  - server components
description: 
---

'Server components' are becoming increasingly common in the web development ecosystem, for good reason.

Traditionally, in a single-page application, even a server-rendered one, the server is only relevant for the _first_ load, after which the client takes over. That has meant that _every_ part of a web app must be capable of being rendered on both client and server. Alternatively, people have opted for multi-page apps, or MPAs, with the cost this brings in user experience.

But this is not always desirable.

Instead, server components allow server-rendering individual components within your client-side apps.

It's possible to use server components within [Nuxt](https://nuxt.com/), even if you are generating a static site. That makes it possible to build complex sites that mix dynamic components, server-rendered HTML and even static chunks of markup.

> :span{class="i-ri:lightbulb-fill h-4 w-4"} Believe it or not, Nuxt has had server components since before React.

## Key benefits

1. ⚡️ Server components allow you to extract logic **out of your client-side bundle**.

   <br>By moving code into server components, these components (and the components _they_ use) no longer need to by hydrated or 'tracked' by Vue. This is particularly useful for complex or expensive operations that probably don't need to be 'rerun' on the client, like applying a syntax highlighter or parsing markdown.

   <br>In most cases, using server components in your Nuxt site won't be a magic bullet. Rather, it will be a useful option when there is an disproportionate amount of code needed to render a component on the client.

1. 🔐 Server components ensure that **privileged code runs securely**.

   <br>When your logic requires access to a database or needs a private key or secret, server components can be a useful solution. They are one way of separating your concerns. (Though note that other **good** alternatives exist, like moving your server-only code into a Nitro server route that is 'fetched' by your component.)

1. 📦 Server components **don't necessarily require a server at runtime**.

   <br>By default, Nuxt will prerender any server components used in your application. As long as you've crawled every page of your site, and don't load them only on the client, or change the props at runtime, server components should work just as well on a fully static website.

   <br>This means you can use server components on **static hosting** - no need to update to serverless/edge rendering in order to benefit.

   <br><blockquote>⚡️ Plus, if you have enabled payload extraction (which is enabled by default in generated/static sites, and can also be enabled for hybrid deployments), then Nuxt will even prefetch server components used in pages you might navigate to, so they will load instantly.</blockquote>

1. 🔄 Server components **are interchangeable with normal components**.

   <br>Server components/islands can support all the features of normal components, including shared state, access to the current route, and more. Because they behave just like normal components, you can nest them within server components or just sprinkle them through the rest of your code.

   <br>By default, all your plugins will run when rendering server components, unless (coming soon) they are explicitly disabled by setting `island: false` when defining your component.

## Similar but different

There are a other similar-sounding terms floating around that are worth mentioning:

* **React server components (or RSCs)**. This is an entirely different approach to rendering server components which is often linked to streaming responses from server to client.
   
* **'Island' architecture**: popularised by frameworks like [îles](https://iles.pages.dev/) or [Astro](https://astro.build/), this is an architecture which embeds dynamic 'islands' within more static surroundings. The Nuxt approach is the opposite - we embed static 'islands' within a dynamic Nuxt app.

## Using server components

So, how do you use a server component?

First, you'll need to enable the feature (which is still experimental):

<div>~/nuxt.config.ts</div>

```ts
export default defineNuxtConfig({
  experimental: {
    componentIslands: true,
  }
})
```

Then you can 'convert' a component to a server component simply by adding a `.server.vue` suffix. For example, here's a version of my site footer:

<div>~/components/the-site-footer.server.vue</div>

```vue
<script lang="ts" setup>
const links = [
  {
    name: 'GitHub',
    icon: 'i-ri:github-fill',
    link: 'https://github.com/danielroe/',
  },
  // ...
]

const year = new Date().getFullYear()
</script>

<template>
  <div>
    <footer>
      <small> &copy; 2019-{{ year }} Daniel Roe. </small>
      <ul>
        <li v-for="{ link, name, icon } in links">
          <a :href="link" rel="me">
            <span class="h-4 w-4 fill-current" :class="icon" alt="" />
            <span class="sr-only">
              {{ name }}
            </span>
          </a>
        </li>
      </ul>
    </footer>
  </div>
</template>
```

There's no need for any of that to be dynamic, so this is a great candidate for a server component. All I did was add the `.server.` suffix. I still use it in exactly the same way as before.

```vue
<template>
  <div>
    <LayoutTheSiteHeader />
    <NuxtPage />
    <LayoutTheSiteFooter />
  </div>
</template>
```

### Case study: Nuxt Content

One interesting use-case is to create a server component that simply renders a Nuxt content page. Assuming you have `@nuxt/content` installed, this magical component will render any route as a server component.

<div>~/components/static-markdown-render.server.vue</div>

```ts
import { h } from 'vue'
import { ContentRendererMarkdown } from '#components'

export default defineComponent({
  props: {
    path: String,
  },
  async setup(props) {
    if (process.dev) {
      const { data } = await useAsyncData(() =>
        queryContent(props.path!).findOne()
      )
      return () => h(ContentRendererMarkdown, { value: data.value! })
    }
    const value = await queryContent(props.path!).findOne()
    return () => h(ContentRendererMarkdown, { value })
  },
})
```

I then use it like this:

```vue
<template>
  <StaticMarkdownRender path="/" />
</template>
```

⚠️ For now, `<NuxtLink>` components are not interactive, meaning you might need to add some code like this in the parent page, as a 'pretend' version of client-side routing:

```ts
import { parseURL } from 'ufo'

function handleNavigationClicks(e: MouseEvent | KeyboardEvent) {
  const anchor = (e.target as HTMLElement).closest('a')
  if (anchor) {
    const href = anchor.getAttribute('href')
    if (href) {
      e.preventDefault()
      const url = parseURL(href)
      if (!url.host || url.host === 'roe.dev') {
        return navigateTo(url.pathname)
      }

      return navigateTo(href, { external: true })
    }
  }
}
```

## Roadmap

I plan to keep this article up-to-date as we roll out new features and update how this works. If you have any questions, please [let me know](mailto:daniel@roe.dev) and I'll do my best to cover them here.

If you're interested in following on, here are a few next steps I'm pretty excited about:

* 🌎 **Remote sources**. It will be possible soon to load server components from other websites, enabling you to create Nuxt microservices that render components which you can use in different websites. [Check out this PR](https://github.com/nuxt/nuxt/pull/21592).

* 😴 **'Lazy' server components**. Soon it will be possible to display 'fallback' content while a server component loads to avoid blocking navigation. [Check out this PR](https://github.com/nuxt/nuxt/pull/21918).

* 🏝️ **Islands of interactivity**. It's already possible to have interactive client slots within server components, but soon we will support arbitrary interactive components within server component HTML.

* 💡 **ServerOnly**. It might be nice to support a `<ServerOnly>` component that automatically converts sections of markup into server-only sections that get rendered on the server...

You can also follow the [Nuxt server component roadmap](https://github.com/nuxt/nuxt/issues/19772) in our GitHub repository.

## Exploring futher

If you want to see which parts of my site are server components, try clicking this button to see what I've chosen to render as a server component - and then click around to other pages:

<button data-site-ui="" class="underlined-link"><span class="i-ri:magic-fill h-4 w-4"></span> Show server component outlines</button>
