<script setup>
import { ref } from "vue"
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from "firebase/auth"
import { auth } from "../firebase" 
import { useRouter } from "vue-router"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"

const password = ref("")
const rememberMe = ref(false)
const router = useRouter()
const loginInput = ref("")

async function login() {
  try {
    await setPersistence(
      auth, 
      rememberMe.value ? browserLocalPersistence : browserSessionPersistence
    )
    
    let emailToUse = loginInput.value.trim()

    if (!emailToUse.includes("@")) {
      const usernameDoc = await getDoc(doc(db, "usernames", emailToUse))
      if (!usernameDoc.exists()) {
        alert("Username does not exist.")
        return
      }
      emailToUse = usernameDoc.data().email // use associated email
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailToUse,
      password.value
    )
    console.log("Sucessfully logged in:", userCredential.user)
    router.push("/")
  } catch (error) {
    console.error("Error logging in:", error.message)
    alert(error.message)
  }
}
</script>

<template>
    <div class="login-container">
        <form id="login-form" @submit.prevent="login">
            <h2>Login</h2>
            <div class="input-group">
                <label for="email/username">Email or Username</label>
                <input v-model="loginInput" type="text" id="login" name="login" placeholder="Enter your email or username" required>
            </div>
            <div class="input-group">
                <label for="password">Password </label>
                <input v-model="password" type="password" id="password" name="password" placeholder="Enter your password" required>
            </div>
            <button type="submit">Login</button>
            <label>
                Remember me
                <input type="checkbox" v-model="rememberMe" id="remember me" name="remember me" value="Remember me">
            </label>
        </form>
    </div>
</template>