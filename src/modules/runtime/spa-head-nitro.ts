import head from '#spa-head'

export default defineNitroPlugin(nitro => {
  nitro.hooks.hook('render:html', htmlContext => {
    if (!htmlContext.htmlAttrs.length) {
      htmlContext.htmlAttrs.push(head.htmlAttrs, ' lang="en"')
      htmlContext.head.push(...(head.headTags || []))
      htmlContext.bodyAttrs.push(head.bodyAttrs)
      htmlContext.bodyPrepend.push(...(head.bodyScriptsPrepend || []))
      htmlContext.bodyAppend.push(...(head.bodyScripts || []))
    }
  })
})
