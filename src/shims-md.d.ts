declare module '*.md' {
  import { VueConstructor } from 'vue'
  interface Attributes {
    title: string
    date?: string
  }
  interface VueExport {
    component: VueConstructor
  }
  const attributes: Attributes
  const vue: VueExport
  export { attributes, vue }
}
