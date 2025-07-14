<template>
  <nav
    class="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-3 mb-4"
  >
    <div class="container-fluid">
      <!--- Send to home page if user isn't logged in, otherwise send to dashboard page -->
      <router-link class="navbar-brand fw-bold text-primary" v-if="!username" to="/"
        >Track & Mingle</router-link
      >
      <router-link class="navbar-brand fw-bold text-primary" v-if="username" to="/dashboard"
        >Track & Mingle</router-link
      >

      <!-- For mobile -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
        <ul class="navbar-nav align-items-center gap-3">
          <!-- Only show when user isn't logged in -->
          <li class="nav-item" v-if="!username">
            <router-link class="nav-link" to="/login">Login</router-link>
          </li>
          <li class="nav-item" v-if="!username">
            <router-link class="nav-link" to="/signup">Signup</router-link>
          </li>

          <!-- Only show when user is logged in  -->
          <li
            class="nav-item"
            v-if="username"
            style="color: var(--secondary-color); font-weight: 600"
          >
            Hello, {{ username }}
          </li>
          <li class="nav-item" v-if="username">
            <router-link class="nav-link" to="/tracker">Tracker</router-link>
          </li>

          <!-- Always show -->
          <li>
            <router-link class="nav-link" to="/resources">Resources</router-link>
          </li>
          
          <!-- Included in only show when user is logged in-->
          <li class="nav-item" v-if="username">
            <button class="btn btn-outline-primary btn-sm" @click="signOutUser">
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <main id="app">
    <router-view />
  </main>
</template>

<script setup>
import { ref } from "vue";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "vue-router";

// Track the username to be able to include it in navbar
const username = ref("");

const router = useRouter();

// Function to sign the user out
async function signOutUser() {
  try {
    await signOut(auth);
    router.push("/login");
  } catch (error) {
    console.error("Error signing out:", error);
  }
}

// Function to decide username value based on login state of user
auth.onAuthStateChanged(async (user) => {
  if (user) {
    await user.reload();
    username.value = user.displayName;
  } else {
    username.value = "";
  }
});
</script>
