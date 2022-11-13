---
title: Creating your own sitemap module for Nuxt
date: '2022-11-12T15:08:11.947Z'
tags:
  - nuxt
  - module
  - sitemap
description: "Here's how you can create a Nuxt module to generate a sitemap automatically."
---

When you're dotting the i's and crossing the t's of a shiny new Nuxt website, you will almost certainly want to ensure your site has a sitemap so that search engines know what pages of your site to index. At the moment, the [Nuxt sitemap module](https://github.com/nuxt-community/sitemap-module) hasn't yet been updated for [Nuxt 3](https://v3.nuxtjs.org/). But that shouldn't hold you back; let's make a quick-n-dirty module to generate a sitemap.

## Deciding on the requirements

Here's what we need to achieve for the sitemap I have in mind:

1. **It's for a static site** - so no need to fetch pages at runtime. (If this is something you need, look [below](#a-different-approach-for-a-dynamic-sitemap) instead.)

2. We want **both raw XML and gzipped sitemaps.**

## Scaffolding a module

I routinely extract boilerplate out into [VS Code](https://code.visualstudio.com/) snippets. Here's my snippet for a module. If you want to add it into your own settings, type <kbd>Cmd</kbd>-<kbd>Shift</kbd>-<kbd>P</kbd>, select&nbsp;`Snippets: Configure User Snippets` and then `typescript.json (TypeScript)`.

<div>snippets/typescript.json</div>

```json
{
  "Nuxt Module": {
    "prefix": "mod",
    "body": [
      "import { defineNuxtModule, useNuxt } from '@nuxt/kit'",
      "",
      "export default defineNuxtModule({",
      "  meta: {",
      "    name: '$1',",
      "  },",
      "  setup () {",
      "    const nuxt = useNuxt()",
      "    $2",
      "  },",
      "})"
    ]
  }
}
```

To be fair, this isn't much boilerplate, but still - it saves time.

Start by creating a new file in `~/modules/sitemap.ts` and type `mod` + <kbd>Tab</kbd> to fill in the scaffolding. Hey presto - we have a Nuxt module!

The good news is that Nitro stores a list of all the routes that have been prerendered; all we need to do is get this list. We can do this by hooking into `nitro:init` to get access to the Nitro builder. It has its own hooks, and we can use the Nitro `close` hook to output our sitemap at the very end of the build process.

<div>~/modules/sitemap.ts</div>

```ts
const nuxt = useNuxt()
nuxt.hook('nitro:init', nitro => {
  nitro.hooks.hook('close', async () => {
    const routes = nitro._prerenderedRoutes
      // you might also have other logic to ensure only pages are included
      ?.filter(r => r.fileName?.endsWith('.html'))
      .map(r => r.route)

    if (!routes?.length) return
    // ...
  })
})
```

Now we just need to convert these routes into a sitemap and write it to disk. The good news is that it's not that complex of a file format, and we're not planning on taking advantage of any advanced features of the sitemap like `<priority>` or `<lastmod>` for our simple little static site. So something like this should work just fine:

```ts
const timestamp = new Date().toISOString()
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(route =>
    [
      '<url>',
      `  <loc>https://yourdomain.com${route}</loc>`,
      `  <lastmod>${timestamp}</lastmod>`,
      '</url>',
    ].join('')
  ),
  '</urlset>',
].join('')
```

Finally, all we need to do is write that to disk.

```ts
const dir = nitro.options.output.publicDir
await writeFile(join(dir, 'sitemap.xml'), sitemap)
await writeFile(join(dir, 'sitemap.xml.gz'), gzipSync(sitemap))
```

Here's the full module:

```ts
import { writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { defineNuxtModule, useNuxt } from '@nuxt/kit'
import { join } from 'pathe'

export default defineNuxtModule({
  meta: {
    name: 'sitemap',
  },
  setup() {
    const nuxt = useNuxt()
    nuxt.hook('nitro:init', nitro => {
      nitro.hooks.hook('close', async () => {
        const routes = nitro._prerenderedRoutes
          ?.filter(r => r.fileName?.endsWith('.html'))
          .map(r => r.route)
        if (!routes?.length) return
        const timestamp = new Date().toISOString()
        const sitemap = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...routes.map(
            route =>
              `<url><loc>https://yourdomain.com${route}</loc><lastmod>${timestamp}</lastmod></url>`
          ),
          `</urlset>`,
        ].join('')
        const dir = nitro.options.output.publicDir
        await writeFile(join(dir, 'sitemap.xml'), sitemap)
        await writeFile(join(dir, 'sitemap.xml.gz'), gzipSync(sitemap))
      })
    })
  },
})
```

## Enabling the module

All you need to do to enable your new module is to add it to your `nuxt.config` file.

<div>~/nuxt.config.ts</div>

```ts
export default defineNuxtConfig({
  modules: ['~/modules/sitemap'],
})
```

Now you can run `nuxi generate` and check your `.output/public` folder to make sure that `sitemap.xml` and `sitemap.xml.gz` are present and correct!

## A different approach for a dynamic sitemap

Alternatively, your website may be dynamic (for example, the page slugs may come from a CMS) or you may not be prerendering your routes. In this case, you can skip the module entirely.

Instead, create `~/server/routes/sitemap.xml.get.ts` and add the following:

<div>~/server/routes/sitemap.xml.get.ts</div>

```ts
function ()
export default defineEventHandler(async event => {
  // perform async logic
  const routes = await fetchMyRoutesFromCMS()

  // copy the logic from the module above though you might consider,
  // if relevant, using your CMS's modified date for <lastmod> instead
  const timestamp = new Date().toISOString()
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(
      route => [
          '<url>',
          `  <loc>https://yourdomain.com${route}</loc>`,
          `  <lastmod>${timestamp}</lastmod>`,
          '</url>'
        ].join('')
    ),
    '</urlset>',
  ].join('')

  setHeader(event, 'content-type', 'application/xml')
  return sitemap
})
```

You can then prerender this, if it isn't going to change, with a line in your config file:

```ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/sitemap.xml'],
    },
  },
})
```

If you need it to be dynamic but would benefit from light caching, you can use&nbsp;`defineCachedEventHandler` instead of `defineEventHandler` and Nitro will apply some optimisations for you.
