import { createWebHistory, createRouter } from "vue-router";

import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Signup from "./views/Signup.vue";
import Tracker from "./views/Tracker.vue";
import Resources from "./views/Resources.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/login", name: "Login", component: Login },
  { path: "/signup", name: "Signup", component: Signup },
  { path: "/tracker", name: "Tracker", component: Tracker },
  { path: "/resources", name: "Resources", component: Resources},
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
