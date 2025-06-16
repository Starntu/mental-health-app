<template>
  <div>
    <h1>Track & Mingle </h1>
    <h3>The offical mental health app</h3>
    <p>Here, you can track your mental health, find resources, and connect with others like you.</p>
    <div class="button-container">
      <router-link to="/login">
        <button>Log In</button>
      </router-link> 
      <router-link to="/signup">
        <button>Sign Up</button>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
h1 {
  text-align:center;
  color:aqua;
  margin-bottom: 5px;
  padding-bottom: 5px;
}
h3 {
  margin-top: 0px;
  padding-top: 0px;
}
p {
  text-align: center;
  margin-top: 50px;
}
.button-container {
  display:flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-top: 50px;
}
</style>
