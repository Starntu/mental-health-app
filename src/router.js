import { createWebHistory, createRouter } from "vue-router"

import Home from "./views/Home.vue"
import Login from "./views/Login.vue"

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/login", name: "Login", component: Login },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})