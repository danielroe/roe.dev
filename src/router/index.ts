import Vue from 'vue'
import VueRouter from 'vue-router'
import DefaultLayout from '@/layouts/default.vue'
import { getRoutes } from '../utils/routes'

Vue.use(VueRouter)

const routes = [...getRoutes()]

const createRouter = () =>
  new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
      {
        path: '/',
        component: DefaultLayout,
        children: routes,
      },
    ],
  })

export default createRouter
