---
title: Using serverless functions in Nuxt on ZEIT Now
date: '2019-12-19T19:30:00.000Z'
tags:
  - nuxt
  - now
  - serverless
---

When building a modern web application, you might want to use serverless functions (or lambdas). For example:

1. You might need to keep your code private --- because you are consuming secrets or want to conceal your endpoints.
2. You might need to do processor-intensive operations --- for example, searching a static database.

If you are using [Nuxt](https://nuxtjs.org/) --- a Vue framework for SSR and static generated applications --- you can extract your functions into [server middleware](https://nuxtjs.org/api/configuration-servermiddleware/). As the name suggests, these only run on the server and they are effectively independent of the rest of your application.

If you are using ZEIT Now to host your Nuxt application, you can use the same entrypoints for Nuxt server middleware and your [Now serverless functions](https://zeit.co/docs/v2/serverless-functions/introduction/). The benefit of setting it up this way is:

1. You are not tied to a single hosting provider.
2. You can use Nuxt to manage your routing in local development, rather than `now dev`.

### Write your functions

Now allows you to use `express` as a routing layer --- even though this might seem paradoxical for a serverless framework.

<div>~/api/sample-function.js</div>

```js
const express = require('express')

const app = express()
app.use(express.json())

// It is important that the full path is specified here
app.post('/api/sample-function', function(req, res) {
  let { info } = req.body
  console.log(info)
  res
    .status(200)
    .json({ info })
    .end()
})

module.exports = app
```

### Set up your config for ZEIT Now

If you have a simple project, very little needs to be done. ZEIT Now's zero-config support is improving daily, and will almost certainly work out-of-the-box.

All you need to do is tell Now how to generate a static version of your site.

<div>~/package.json</div>

```json
{
  "scripts": {
    "now-build": "yarn generate"
  }
}
```

However, if you do want the fine-grained control of adding routes manually, you can go ahead and add the function in a `now.json` file. (Note that the below configuration will not work with `@nuxt/now-builder`. I plan to write a future article about configuring a Nuxt lambda for serverless SSR.)

<div>~/now.json</div>

```json
{
  "functions": {
    "api/sample-function.js": {
      "memory": 3008
    }
  },
  "routes": [
    {
      "src": "/api/sample-function",
      "dest": "/api/sample-function.js"
    }
  ]
}
```

### Integrate your functions as server middleware in Nuxt

You can easily detect whether you are operating within the Now environment using the `NOW_REGION` environment variable, and conditionally load your server middleware --- such as if you are using [@nuxt/now-builder](https://github.com/nuxt/now-builder).

If you are using Nuxt to generate a static site, you will also need to make sure the generated site is placed in a `public` directory.

<div>~/nuxt.config.js</div>

```js
const isServerlessEnvironment = !!process.env.NOW_REGION

export default {
  // Conditionally load your server middleware
  // (unnecessary if you are building a static site)
  serverMiddleware: isServerlessEnvironment ? [] : ['~/api/sample-function.js'],

  // If you are generating a static site,
  // this allows Now to detect it automatically
  generate: {
    dir: 'public',
  },

  // rest of your Nuxt config
}
```

You should now have a Nuxt setup that works equally well when deployed to serverless environment on ZEIT Now, or when server-rendered, such as in local development.

### Other platforms

This approach works with other hosting platforms, such as:

- [Netlify Functions](https://www.netlify.com/products/functions/)
- [AWS Lambda](https://aws.amazon.com/lambda/)

However, you will need to export a slightly different object from your server middleware. You can check out the [Nuxt documentation](https://nuxtjs.org/api/configuration-servermiddleware/) for more information.
