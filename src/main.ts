import Vue from 'vue'
import App from './App.vue'
import createRouter from './router'
import VueCompositionApi from '@vue/composition-api'

Vue.use(VueCompositionApi)
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
