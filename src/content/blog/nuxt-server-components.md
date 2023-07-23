---
title: 'A guide to Nuxt server components'
date: '2023-07-23T14:00:00.000Z'
tags:
  - nuxt
  - server components
description: 
---

'Server components' are a concept you may have come across. They have become increasingly common in the web development ecosystem, for good reason.

It's possible to use server components within [Nuxt](https://nuxt.com/), even if you are generating a static site. That makes it possible to build complex sites that mix dynamic components, server-rendered HTML and even static chunks of markup.

> :span{class="i-ri:lightbulb-fill h-4 w-4"} Believe it or not, Nuxt has had server components since before React.

## Similar but different

There are a other similar-sounding terms floating around that are worth mentioning:

* **React server components (or RSCs)**. This is an entirely different approach to rendering server components which is often linked to streaming responses from server to client.
   
* **'Island' architecture**: popularised by frameworks like [îles](https://iles.pages.dev/) or [Astro](https://astro.build/), this is an architecture which embeds dynamic 'islands' within more static surroundings. The Nuxt approach is the opposite - we embed static 'islands' within a dynamic Nuxt app.

## Key benefits

1. ⚡️ Server components allow you to extract logic **out of your client-side bundle**.

   <br>By moving code into server components, these components (and the components _they_ use) no longer need to by hydrated or 'tracked' by Vue. This is particularly useful for complex or expensive operations that probably don't need to be 'rerun' on the client, like applying a syntax highlighter or parsing markdown.

1. 🔐 Server components ensure that **privileged code runs securely**.

   <br>When your logic requires access to a database or needs a private key or secret, server components can be a useful solution. They are one way of separating your concerns. (Though note that other alternatives exist, like moving your server-only code into a Nitro server route that is 'fetched' by your component.)

1. 📦 Server components **don't necessarily require a server at runtime**.

   <br>By default, Nuxt will prerender any server components used in your application. As long as you've crawled every page of your site, and don't load them only on the client, or change the props at runtime, server components should work just as well on a fully static website.

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

## Roadmap

I plan to keep this article up-to-date as we roll out new features and update how this works. If you have any questions, please [let me know](mailto:daniel@roe.dev) and I'll do my best to cover them here.

If you're interested in following on, here are a few next steps I'm pretty excited about:

* **Remote sources**. It will be possible soon to load server components from other websites, enabling you to have microservices that render components which you can use in different websites. <br><br>👉 Follow [this PR](https://github.com/nuxt/nuxt/pull/21592) for more.

* **'Lazy' server components**. Soon it will be possible to display 'fallback' content while a server component loads to avoid blocking navigation. <br><br>👉  Follow [this PR](https://github.com/nuxt/nuxt/pull/21918) for more.

* **Islands of interactivity**. It's already possible to have interactive client slots within server components, but soon we will support arbitrary interactive components within server component HTML.

You can also follow the [Nuxt server component roadmap](https://github.com/nuxt/nuxt/issues/19772) in our GitHub repository.

## Exploring futher

If you want to see which parts of my site are server components, try clicking this button to see what I've chosen to render as a server component - and then click around to other pages:

<button data-site-ui="" class="underlined-link"><span class="i-ri:magic-fill h-4 w-4"></span> Show server component outlines</button>
