<template>
  <div class="container mt-4">
    <h1 class="text-center mb-4">Start a Private Chat</h1>
    <form @submit.prevent="startChat" class="d-flex gap-2 justify-content-center">
      <input
        v-model="targetUsername"
        type="text"
        class="form-control w-50"
        placeholder="Enter username"
        required
      />
      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? "Checking..." : "Start Chat" }}
      </button>
    </form>
    <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const router = useRouter();

// Reactive variables
const targetUsername = ref("");
const loading = ref(false);
const error = ref("");

// Start private chat with entered username
const startChat = async () => {
  error.value = "";
  loading.value = true;

  try {
    // Get the document in the usernames collection with matching username (trim in case of extra spaces)
    const docRef = doc(db, "usernames", targetUsername.value.trim());
    const docSnap = await getDoc(docRef);

    // If user doesnt exist, show error, else, navigate to the private chat with user
    if (!docSnap.exists()) {
      error.value = "Username not found. Please try again.";
    } else {
      router.push(`/privateChat/${targetUsername.value.trim()}`);
    }
  } catch (err) {
    error.value = "An error occurred. Please try again.";
    console.error("Error starting chat:", err);
  } finally {
    loading.value = false;
  }
};
</script>