<template>
    <nav>
    <ul>
      <li>
        <router-link to="/">Home</router-link>
      </li>
      <li>
        <router-link to="/login">Login</router-link>

      </li>
    </ul>
  </nav>

  <img alt="Vue logo" src="./assets/logo.png" />
  <router-view />
</template>