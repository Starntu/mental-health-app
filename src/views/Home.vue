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
  border-radius: 1rem;
  box-shadow: 0 12px 35px rgba(0,0,0,0.3);
  text-align: center;
  color: #ffe5f1;
  user-select: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
}

.home-hero:hover {
  transform: translateZ(10px) translateY(-5px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.4);
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.25em;
  font-weight: 800;
  background: linear-gradient(90deg, #ff3eb0, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

h3 {
  margin-top: 0;
  font-weight: 500;
  color: #ffd700;
}

p {
  margin-top: 1.5rem;
  margin-bottom: 0;
  color: #ffe5f1;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}

.button-container button {
  width: 200px;
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 1rem;
  border: none;
  color: #ffe5f1;
  background: linear-gradient(145deg, #9d4edd, #7b3aed);
  box-shadow: 0 6px 10px rgba(155,77,237,0.4), inset 0 -3px 5px rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0,0,0,0.25);
}

.button-container button:hover {
  background: linear-gradient(145deg, #7b3aed, #9d4edd);
  box-shadow: 0 8px 15px rgba(155,77,237,0.6), inset 0 3px 8px rgba(255,255,255,0.2);
  transform: translateY(-3px);
}
</style>