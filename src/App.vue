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
          <li class="nav-item" v-if="username">
            <router-link class="nav-link" to="/publicChat">Public Chat</router-link>
          </li>
          <li class="nav-item" v-if="username">
            <router-link class="nav-link" to="/privateChat">Private Chat</router-link>
          </li>

          <!-- Always show -->
           <li>
              <router-link class="nav-link" to="/breathingTool">Breathing Tool</router-link>
           </li>
          <li>
            <router-link class="nav-link" to="/resources">Resources</router-link>
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
              <span v-if="unreadCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle badge-sm">
                {{ unreadCount }}
              </span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li v-if="notifications.length === 0" class="dropdown-item text-muted">No notifications</li>
              <li 
                v-for="(notif, index) in notifications" 
                :key="index" 
                class="dropdown-item d-flex flex-column"
                :class="{ 'unread-notif': !notif.read }"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <span class="notif-message">{{ notif.message }}</span>
                  <span v-if="!notif.read" class="badge bg-danger rounded-circle ms-2" style="width:8px; height:8px;"></span>
                </div>
                <small class="text-muted">{{ formatDate(notif.timestamp) }}</small>
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
    where("read", "==", true)
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
  const unreadNotifs = notifications.value.filter(n => !n.read);

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
      orderBy("timestamp", "desc")
    );

    // Real time updates
    onSnapshot(notifQuery, (snapshot) => {
      const newNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notifications.value = newNotifs;
      unreadCount.value = newNotifs.filter(n => !n.read).length;
    });
  } else {
    username.value = "";
    notifications.value = [];
    unreadCount.value = 0;
  }
});
</script>

<style>
.unread-notif {
  background-color: #e9f5ff;
  font-weight: bold;
}

.notif-message {
  word-break: break-word;
}
</style>
