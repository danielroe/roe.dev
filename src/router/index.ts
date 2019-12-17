import Vue, { VueConstructor } from 'vue'
import VueRouter from 'vue-router'
import DefaultLayout from '@/layouts/default.vue'

Vue.use(VueRouter)

const Index = () =>
  import(/* webpackChunkName: "page-index" */ '@/pages/index.vue')
const Work = () =>
  import(/* webpackChunkName: "page-work" */ '@/pages/work.vue')
const BlogIndex = () =>
  import(/* webpackChunkName: "page-blog-index" */ '@/pages/blog/index.vue')
const BlogArticle = () =>
  import(
    /* webpackChunkName: "page-blog-article" */ '@/pages/blog/_article.vue'
  )

const routes = [
  {
    name: 'index',
    path: '',
    component: Index,
  },
  {
    name: 'work',
    path: 'work',
    component: Work,
  },
  {
    name: 'blog-index',
    path: 'blog',
    component: BlogIndex,
  },
  {
    name: 'blog-article',
    path: 'blog/:article?',
    component: BlogArticle,
  },
]

const createRouter = () =>
  new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
      {
        path: '/',
        component: DefaultLayout as VueConstructor<Vue>,
        children: routes,
      },
    ],
  })

export default createRouter
