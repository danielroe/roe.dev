import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
Vue.use(VueCompositionApi)

import App from './App.vue'
import createRouter from './router'
import { ComponentOptions } from 'vue'

Vue.config.productionTip = false

export default function createApp() {
  const router = createRouter()
  const options: ComponentOptions<any> = {
    router,
    head: {},
    render: h => h(App),
  }

  return options
}
