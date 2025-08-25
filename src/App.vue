<template>
  <nav
    class="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-3 mb-4"
  >
    <div class="container-fluid">
      <!--- Send to home page if user isn't logged in, otherwise send to dashboard page -->
      <router-link
        class="navbar-brand fw-bold text-primary"
        v-if="!username"
        to="/"
        >Track & Mingle</router-link
      >
      <router-link
        class="navbar-brand fw-bold text-primary"
        v-if="username"
        to="/dashboard"
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
          <li class="nav-item" v-if="username">
            <router-link class="nav-link" to="/publicChat"
              >Public Chat</router-link
            >
          </li>
          <li class="nav-item" v-if="username">
            <router-link class="nav-link" to="/privateChat"
              >Private Chat</router-link
            >
          </li>

          <!-- Always show -->
          <li>
            <router-link class="nav-link" to="/breathingTool"
              >Breathing Tool</router-link
            >
          </li>
          <li>
            <router-link class="nav-link" to="/resources"
              >Resources</router-link
            >
          </li>

          <!-- Included in only show when user is logged in-->

          <!-- Notifications -->
          <li class="nav-item dropdown" v-if="username">
            <a
              class="nav-link dropdown-toggle position-relative"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click="markNotificationsAsRead"
            >
              🔔
              <span
                v-if="unreadCount > 0"
                class="badge bg-danger position-absolute top-0 start-100 translate-middle badge-sm"
              >
                {{ unreadCount }}
              </span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li
                v-if="notifications.length === 0"
                class="dropdown-item text-muted"
              >
                No notifications
              </li>
              <li
                v-for="(notif, index) in notifications"
                :key="index"
                class="dropdown-item d-flex flex-column"
                :class="{ 'unread-notif': !notif.read }"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <span class="notif-message">{{ notif.message }}</span>
                  <span
                    v-if="!notif.read"
                    class="badge bg-danger rounded-circle ms-2"
                    style="width: 8px; height: 8px"
                  ></span>
                </div>
                <small class="text-muted">{{
                  formatDate(notif.timestamp)
                }}</small>
              </li>
            </ul>
          </li>

          <!-- Sign Out -->
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
import { ref, onMounted } from "vue";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "vue-router";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

// Track the username
const username = ref("");

// For array of notifications and to keep track of how many are unread
const notifications = ref([]);
const unreadCount = ref(0);

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

// Function to format timestamp into a readable date string
function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
}

// Function to remove read notifications after 1 day
async function clearOldReadNotifications(userUid) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, "notifications"),
    where("to", "==", userUid),
    where("read", "==", true),
  );
  const snapshot = await getDocs(q);
  for (const notifDoc of snapshot.docs) {
    const data = notifDoc.data();
    if (data.timestamp && data.timestamp.toDate() < oneDayAgo) {
      await deleteDoc(doc(db, "notifications", notifDoc.id));
    }
  }
}

// Function to mark unread notifications as read when dropdown is opened
async function markNotificationsAsRead() {
  const unreadNotifs = notifications.value.filter((n) => !n.read);

  for (const notif of unreadNotifs) {
    const notifRef = doc(db, "notifications", notif.id);
    await updateDoc(notifRef, { read: true });
  }

  unreadCount.value = 0;
}

// Watch login state and load notifications when user is logged in
auth.onAuthStateChanged(async (user) => {
  if (user) {
    await user.reload();

    username.value = user.displayName;

    // Clear old notifications before loading new ones
    await clearOldReadNotifications(user.uid);

    // Sort notifications newest to oldest
    const notifQuery = query(
      collection(db, "notifications"),
      where("to", "==", user.uid),
      orderBy("timestamp", "desc"),
    );

    // Real time updates
    onSnapshot(notifQuery, (snapshot) => {
      const newNotifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      notifications.value = newNotifs;
      unreadCount.value = newNotifs.filter((n) => !n.read).length;
    });
  } else {
    username.value = "";
    notifications.value = [];
    unreadCount.value = 0;
  }
});
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
}
</style>

<style scoped>
#app {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  min-height: 100vh;
  color: #f9fafb;
}

.navbar {
  background: linear-gradient(90deg, #7b3aed, #9d4edd);
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  padding: 1rem 2rem;
}

.navbar-brand {
  font-weight: bold;
  font-size: 1.5rem;
  background: linear-gradient(90deg, #ff7eb3, #ff758c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-link {
  color: #f9fafb !important;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #ffd700 !important;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
}

.card {
  background: #1e293b;
  border: none;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.5);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.6);
}

button,
.btn {
  background: linear-gradient(90deg, #6a11cb, #9d4edd);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  padding: 10px 16px;
  transition: all 0.3s ease;
}

button:hover,
.btn:hover {
  background: #9d4edd;
  transform: translateY(-2px);
  box-shadow: 0 0 10px rgba(157, 78, 221, 0.7); /* glow effect */
}

.form-control {
  background: #1e293b;
  border: 1px solid #334155;
  color: #f9fafb;
  border-radius: 8px;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.form-control:focus {
  border-color: #9d4edd;
  box-shadow: 0 0 10px rgba(157, 78, 221, 0.6);
  outline: none;
}

.unread-notif {
  background-color: rgba(155, 135, 255, 0.15); /* subtle purple tint */
  font-weight: bold;
  border-left: 4px solid #ffd700; /* gold accent for visibility */
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.notif-message {
  word-break: break-word;
}

h2,
h3,
h4 {
  font-weight: bold;
  color: #e0e7ff;
}
</style>
