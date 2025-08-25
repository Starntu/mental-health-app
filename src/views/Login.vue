<template>
  <div class="login-container">
    <form id="login-form" @submit.prevent="login">
      <h2>Login</h2>

      <div class="floating-label">
        <input
          v-model="loginInput"
          type="text"
          id="login"
          name="login"
          placeholder=" "
          required
        />
        <label for="email/username">Email or Username</label>
      </div>

      <div class="floating-label">
        <input
          v-model="password"
          type="password"
          id="password"
          name="password"
          placeholder=" "
          required
        />
        <label for="password">Password </label>
      </div>

      <button type="submit">Login</button>

      <label>
        Remember Me
        <input
          type="checkbox"
          v-model="rememberMe"
          id="remember me"
          name="remember me"
          value="Remember Me"
        />
      </label>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Reactive variables
const password = ref("");
const rememberMe = ref(false);
const loginInput = ref("");

const router = useRouter();

// Function to handle logging in
async function login() {
  try {
    // Set Firebase persistence based on the "Remember Me" checkbox from user
    await setPersistence(
      auth,
      rememberMe.value ? browserLocalPersistence : browserSessionPersistence,
    );

    // Trim input
    let emailToUse = loginInput.value.trim();

    // If input is a username rather than email, get associated email
    if (!emailToUse.includes("@")) {
      const usernameDoc = await getDoc(doc(db, "usernames", emailToUse));
      if (!usernameDoc.exists()) {
        alert("Username does not exist.");
        return;
      }
      emailToUse = usernameDoc.data().email;
    }

    // Login using Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailToUse,
      password.value,
    );
    console.log("Sucessfully logged in:", userCredential.user);
    router.push("/dashboard");
  } catch (error) {
    console.error("Error logging in:", error.message);
    alert(error.message);
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 2.5rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
  text-align: center;
  color: #ffe5f1;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.login-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

h2 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #ff3eb0, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.floating-label {
  position: relative;
  margin-bottom: 2rem;
  text-align: left;
}

.floating-label input {
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 1rem;
  padding: 1.25rem 1rem 0.5rem;
  color: #ffe5f1;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);
}

.floating-label label {
  position: absolute;
  top: 1.05rem;
  left: 1rem;
  font-size: 1rem;
  color: #ffe5f1;
  pointer-events: none;
  transition: 0.2s ease all;
}

.floating-label input:focus + label,
.floating-label input:not(:placeholder-shown) + label {
  top: 0.3rem;
  left: 1rem;
  font-size: 0.75rem;
  color: #ffd700;
}

button {
  width: 100%;
  padding: 0.85rem;
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 1rem;
  border: none;
  color: #ffe5f1;
  background: linear-gradient(145deg, #9d4edd, #7b3aed);
  box-shadow:
    0 6px 10px rgba(155, 77, 237, 0.4),
    inset 0 -3px 5px rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

button:hover {
  background: linear-gradient(145deg, #7b3aed, #9d4edd);
  box-shadow:
    0 8px 15px rgba(155, 77, 237, 0.6),
    inset 0 3px 8px rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
}

button:active {
  box-shadow:
    0 3px 6px rgba(155, 77, 237, 0.4),
    inset 0 1px 3px rgba(255, 255, 255, 0.15);
  transform: translateY(0);
}

label[for="remember me"] {
  font-size: 0.9rem;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}
</style>
