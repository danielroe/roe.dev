export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('render:island', island => {
    if (island.html.startsWith('<!--[-->')) {
      island.html = `<div data-island>${island.html}</div>`
    }
    else {
      island.html = island.html.replace(/(<\w+)([ >])/, '$1 data-island$2')
    }
  })
})
