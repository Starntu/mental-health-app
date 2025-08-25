<template>
  <div class="container mt-4">
    <h1 class="text-center mb-4">Start a Private Chat</h1>
    <form
      @submit.prevent="startChat"
      class="d-flex gap-2 justify-content-center"
    >
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

<style scoped>
.container {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  border-radius: 1rem;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
  color: #ffe5f1;
  min-height: 60vh;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #ff3eb0, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

form {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

input.form-control {
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  border: none;
  background: #7b3aed;
  color: #ffe5f1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transition:
    transform 0.3s,
    background 0.3s;
}

input.form-control::placeholder {
  color: #ffb6ff;
  opacity: 0.8;
}

input.form-control:focus {
  outline: none;
  transform: scale(1.02);
  background: #9d4edd;
}

button.btn-primary {
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ff3eb0, #ff8c42);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

button.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

p.text-danger {
  color: #ff3eb0;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-top: 1rem;
}
</style>
