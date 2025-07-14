<template>
  <div class="home-hero card fade-in-up">
    <h1>Track & Mingle</h1>
    <h3>The Official Mental Health App</h3>
    <p>
      Track your mental health, find resources, and connect with others like
      you.
    </p>

    <div
      class="button-container d-flex flex-column align-items-center gap-3 mt-4"
    >
      <router-link to="/login">
        <button class="btn btn-primary px-5 py-2">Log In</button>
      </router-link>

      <router-link to="/signup">
        <button class="btn btn-outline-primary px-5 py-2">Sign Up</button>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const router = useRouter();
const auth = getAuth();

// Take user to dashboard if logged in
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      router.push("/dashboard");
    }
  });
});
</script>


<style scoped>
.home-hero {
  max-width: 600px;
  margin: 80px auto 40px;
  padding: 3rem 2rem;
  background: rgba(255 255 255 / 0.3);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: var(--primary-color);
  user-select: none;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  cursor: default;
}

.home-hero:hover {
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  transform: translateZ(10px) translateY(-5px);
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.25em;
  color: var(--primary-color);
}

h3 {
  margin-top: 0;
  font-weight: 500;
  color: var(--secondary-color);
}

p {
  margin-top: 1.5rem;
  margin-bottom: 0;
  color: #555;
}

.button-container button {
  font-weight: 600;
  font-size: 1rem;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
  transition:
    transform 0.2s ease,
    box-shadow 0.3s ease;
}

.button-container button:hover {
  box-shadow: 0 10px 25px rgba(30, 64, 175, 0.5);
  transform: translateY(-3px);
}
</style>
