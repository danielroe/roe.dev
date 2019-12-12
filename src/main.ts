import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
Vue.use(VueCompositionApi)

import App from './App.vue'
import createRouter from './router'

Vue.config.productionTip = false

export default function createApp() {
  const router = createRouter()
  const app = new Vue({
    router,
    head: {},
    render: h => h(App),
  })

  return { app, router }
}
