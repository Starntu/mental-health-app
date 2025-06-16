<script setup>
import { ref } from "vue"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "../firebase"
import { useRouter } from "vue-router"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../firebase"

const email = ref("")
const password = ref("")
const router = useRouter()

const username = ref("")

async function signup() {
  try {
    const usernameTrimmed = username.value.trim()
    if (!usernameTrimmed) {
      alert("Username is required.")
      return
    }

    const usernameRef = doc(db, "usernames", usernameTrimmed)
    const usernameSnap = await getDoc(usernameRef)

    if (usernameSnap.exists()) {
      alert("Username is already taken.")
      return
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    )
    console.log("Sucessfully signed up user:", userCredential.user)
        
    await updateProfile(userCredential.user, {
      displayName: usernameTrimmed
    })

    await setDoc(doc(db, "usernames", usernameTrimmed), {
      uid: userCredential.user.uid,
      email: email.value
    })
    
    await router.push("/")
    window.location.reload()
  } catch (error) {
    console.error("Error signing up:", error.message)
    alert(error.message)
  }
  window.location.reload()
}
</script>


<template>
    <div class="signup-container">
        <form id="signup-form" @submit.prevent="signup">
            <h2>Signup</h2>
            <div class="input-group">
                <label for="email">Email</label>
                <input v-model="email" type="email" id="email" name="email" placeholder="Enter your email" required>
            </div>
            <div class="input-group">
                <label for="username">Username</label>
                <input v-model="username" type="text" id="username" name="username" placeholder="Enter your username" required>
            </div>
            <div class="input-group">
                <label for="password">Password </label>
                <input v-model="password" type="password" id="password" name="password" placeholder="Enter your password" required>
                <p class="password-note">*Password must be at least 6 characters long</p>
            </div>
            <button type="submit">Signup</button>
        </form>
    </div>
</template>