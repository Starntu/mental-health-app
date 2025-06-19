<script setup>
import { ref } from "vue"
import { auth } from "./firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "vue-router"

const username = ref("")
const router = useRouter()

async function signOutUser() {
  try {
    await signOut(auth)
    router.push("/login")
  } catch (error) {
    console.error("Error signing out:", error)
  }
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    await user.reload()
    username.value = user.displayName
  } else {
    username.value = ""
  }
})
</script>

<template>
    <nav>
    <ul>
      <li><router-link to="/">Home</router-link></li>
      <li v-if="!username"><router-link to="/login">Login</router-link></li>
      <li v-if="!username"><router-link to="/signup">Signup</router-link></li>
      <li v-if="username">Hello, {{ username }}</li>
      <li v-if="username"><router-link to="/tracker">Tracker</router-link></li>
      <li v-if="username"><button @click="signOutUser">Sign Out</button></li>
    </ul>
  </nav>

  <img alt="Vue logo" src="./assets/logo.png" />
  <router-view />
</template>