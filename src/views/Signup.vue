<template>
  <div class="signup-container">
    <form id="signup-form" @submit.prevent="signup">
      <h2>Signup</h2>

      <div class="floating-label">
        <input
          v-model="email"
          type="email"
          id="email"
          name="email"
          placeholder=" "
          required
        />
        <label for="email">Email</label>
      </div>

      <div class="floating-label">
        <input
          v-model="username"
          type="text"
          id="username"
          name="username"
          placeholder=" "
          required
        />
        <label for="username">Username</label>
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

      <p class="password-note">*Password must be at least 6 characters long</p>

      <button type="submit">Signup</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "vue-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// Reactive variables
const email = ref("");
const password = ref("");
const username = ref("");

const router = useRouter();

// Function to handle signing up
async function signup() {
  try {
    const usernameTrimmed = username.value.trim();

    // Check if username is empty
    if (!usernameTrimmed) {
      alert("Username is required.");
      return;
    }

    // Check if username is already taken
    const usernameRef = doc(db, "usernames", usernameTrimmed);
    const usernameSnap = await getDoc(usernameRef);
    if (usernameSnap.exists()) {
      alert("Username is already taken.");
      return;
    }

    // Create new user after they sign up
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );
    console.log("Sucessfully signed up user:", userCredential.user);

    // Update users displayname to their username
    await updateProfile(userCredential.user, {
      displayName: usernameTrimmed,
    });

    // Link users id and email to their username
    await setDoc(doc(db, "usernames", usernameTrimmed), {
      uid: userCredential.user.uid,
      email: email.value,
    });

    // Redirect to home page and then relod after signup
    await router.push("/");
    window.location.reload();
  } catch (error) {
    console.error("Error signing up:", error.message);
    alert(error.message);
  }
  // Extra reload for certainty
  window.location.reload();
}
</script>

<style scoped>
.signup-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 2.5rem 2rem;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: var(--primary-color);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.signup-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.floating-label {
  position: relative;
  margin-bottom: 2rem;
  text-align: left;
}

.floating-label input {
  width: 100%;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  border-radius: 12px;
  padding: 1.25rem 1rem 0.5rem;
  color: #213547;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
}

.floating-label label {
  position: absolute;
  top: 1.05rem;
  left: 1rem;
  font-size: 1rem;
  color: #666;
  pointer-events: none;
  transition: 0.2s ease all;
}

.floating-label input:focus + label,
.floating-label input:not(:placeholder-shown) + label {
  top: 0.3rem;
  left: 1rem;
  font-size: 0.75rem;
  color: var(--primary-color);
}

button {
  width: 100%;
  padding: 0.85rem;
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 14px;
  border: none;
  color: white;
  background: linear-gradient(145deg, #4a90e2, #357abd);
  box-shadow:
    0 6px 10px rgba(53, 122, 189, 0.4),
    inset 0 -3px 5px rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

button:hover {
  background: linear-gradient(145deg, #357abd, #2a5f9e);
  box-shadow:
    0 8px 15px rgba(41, 84, 141, 0.6),
    inset 0 3px 8px rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
}

button:active {
  box-shadow:
    0 3px 6px rgba(41, 84, 141, 0.4),
    inset 0 1px 3px rgba(255, 255, 255, 0.15);
  transform: translateY(0);
}

.password-note {
  font-size: 0.8rem;
  color: #555;
  margin-top: -1rem;
  margin-bottom: 1.5rem;
  text-align: left;
  padding-left: 1rem;
  font-style: italic;
}
</style>
