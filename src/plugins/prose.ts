import {
  ProseP,
  ProseA,
  ProseH3,
  ProseLi,
  ProseOl,
  ProseUl,
  ProseThead,
  ProseTable,
  ProseTr,
  ProseTd,
  ProseTh,
  ProseTbody,
  ProseCode,
  ProseCodeInline,
} from '#components'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component('ProseP', ProseP)
  nuxtApp.vueApp.component('ProseA', ProseA)
  nuxtApp.vueApp.component('ProseH3', ProseH3)
  nuxtApp.vueApp.component('ProseLi', ProseLi)
  nuxtApp.vueApp.component('ProseOl', ProseOl)
  nuxtApp.vueApp.component('ProseUl', ProseUl)
  nuxtApp.vueApp.component('ProseThead', ProseThead)
  nuxtApp.vueApp.component('ProseTable', ProseTable)
  nuxtApp.vueApp.component('ProseTr', ProseTr)
  nuxtApp.vueApp.component('ProseTd', ProseTd)
  nuxtApp.vueApp.component('ProseTh', ProseTh)
  nuxtApp.vueApp.component('ProseTbody', ProseTbody)
  nuxtApp.vueApp.component('ProseCode', ProseCode)
  nuxtApp.vueApp.component('ProseCodeInline', ProseCodeInline)
})
