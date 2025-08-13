<template>
  <div class="container mt-4">
    <h1 class="text-center mb-4">Track and Mingle — Public Chat</h1>

    <!-- Ban notice for if user is banned -->
    <div v-if="isBanned" class="alert alert-danger text-center mb-3">
      <template v-if="banPermanent">
        You are <strong>permanently banned</strong> from public chat.
      </template>
      <template v-else>
        You are banned from public chat for <strong>{{ remainingBanDays }}</strong> more day(s).
      </template>
    </div>

    <!-- Chat messages -->
    <div class="card mb-3" style="height: 400px; overflow-y: auto;" ref="messagesContainer">
      <div class="card-body">
        <div
          v-for="message in messages"
          :key="message.id"
          class="mb-3 border-bottom pb-2"
        >
          <strong
            class="text-primary"
            style="cursor: pointer"
            @click="goToPrivateChat(message.sender)"
          >
            {{ message.sender }}
          </strong>
          : {{ message.message }}

          <!-- report button -->
          <button 
            class="btn btn-link text-danger p-0 ms-2" 
            @click="openReportModal(message.sender, message.id, 'public')"
          >🚩 Report</button>
        </div>
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="d-flex gap-2">
      <input
        v-model="newMessage"
        type="text"
        class="form-control"
        :disabled="isBanned"
        placeholder="Type your message..."
      />
      <button class="btn btn-primary" type="submit" :disabled="isBanned">Send</button>
    </form>

    <!-- Report modal -->
    <div v-if="showReportModal" class="modal-backdrop">
      <div class="modal-content">
        <button class="close-btn" @click="closeModal">×</button>
        <h3 class="mb-3">Submit a Report</h3>
        <p>Thank you for looking out for yourself and others by reporting inappropriate behavior. Please explain your report at the bottom.</p>

        <textarea 
          v-model="reportReason" 
          class="form-control mt-3" 
          rows="4" 
          placeholder="Explain your report..."
        ></textarea>

        <div class="d-flex justify-content-end mt-3">
          <button class="btn btn-danger" @click="submitReport">Submit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useRouter } from "vue-router";
import { Filter } from "bad-words";

const router = useRouter()

// Reactive variables
const newMessage = ref("")
const messages = ref([])
const messagesContainer = ref(null)
const username = ref("")

// Profanity filter
const filter = new Filter()

// Report modal reactive variables
const showReportModal = ref(false)
const reportReason = ref("")
const reportedUser = ref("")
const reportedMessageId = ref("")
const reportedChatType = ref("")

// Ban reactive variables
const isBanned = ref(false);
const banPermanent = ref(false);
const banExpiresTimestamp = ref(null);

// Compute the days remaining in users ban
const remainingBanDays = computed(() => {
  if (!banExpiresTimestamp.value) return 0;
  const now = Date.now();
  const expires = banExpiresTimestamp.value.toMillis();
  const diffMs = expires - now;
  return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
});

// Auto scroll to bottom on new messages
watch(messages, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

// Send a new message
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  // Stop user from sending messages when banned
  if (isBanned.value) {
    if (banPermanent.value) {
      alert("You are permanently banned from public chat and cannot send messages.");
    } else {
      alert(`You are banned from public chat for ${remainingBanDays.value} more day(s).`); 
    }
    return;
  }

  if (await checkBanStatusPublic(username.value)) return;

  // Filter profanity
  const cleanMessage = filter.clean(newMessage.value.trim())

  // Save message
  await addDoc(collection(db, "publicMessages"), {
    sender: username.value,
    message: cleanMessage,
    timestamp: serverTimestamp()
  })

  newMessage.value = ""
}

// Check if a user is banned from public chatting
const checkBanStatusPublic = async (name) => {
  const banRef = doc(db, "publicChatBans", name);
  const banSnap = await getDoc(banRef);
  if (banSnap.exists()) {
    const banData = banSnap.data();
    const now = Date.now();
    if (banData.permanent) {
      isBanned.value = true;
      banPermanent.value = true;
      banExpiresTimestamp.value = null;
      return true;
    }
    if (banData.banExpires && banData.banExpires.toMillis() > now) {
      isBanned.value = true;
      banPermanent.value = false;
      banExpiresTimestamp.value = banData.banExpires;
      return true;
    }
  }
  return false;
};

// Live ban changes in public chat
const listenForBanChanges = (name) => {
  const banRef = doc(db, "publicChatBans", name);
  onSnapshot(banRef, (docSnap) => {
    if (docSnap.exists()) {
      const banData = docSnap.data();
      const now = Date.now();
      if (banData.permanent) {
        isBanned.value = true;
        banPermanent.value = true;
        banExpiresTimestamp.value = null;
        alert("You are permanently banned from public chat.");
      } else if (banData.banExpires && banData.banExpires.toMillis() > now) {
        isBanned.value = true;
        banPermanent.value = false;
        banExpiresTimestamp.value = banData.banExpires;
        const remainingDays = Math.ceil(
          (banData.banExpires.toMillis() - now) / (1000 * 60 * 60 * 24)
        );
        alert(`You are banned from public chat for ${remainingDays} more day(s).`);
      } else {
        // Ban expired
        isBanned.value = false;
        banPermanent.value = false;
        banExpiresTimestamp.value = null;
      }
    } else {
      // No ban record
      isBanned.value = false;
      banPermanent.value = false;
      banExpiresTimestamp.value = null;
    }
  });
};

// Keep track of and update report count for public chat ban
const incrementReportCountPublic = async (name) => {
  const currentUserUID = auth.currentUser.uid;
  const banRef = doc(db, "publicChatBans", name);
  const banSnap = await getDoc(banRef);

  let reportCount = 0;
  let weekBanCount = 0;

  if (banSnap.exists()) {
    const data = banSnap.data();
    reportCount = data.reportCount || 0;
    weekBanCount = data.weekBanCount || 0;
  }
  reportCount += 1;

  if (reportCount >= 3) {
    weekBanCount += 1;
    reportCount = 0;

    if (weekBanCount >= 3) {
      // User is permanently  banned after 3, 1 week bans
      await setDoc(banRef, {
        uid: currentUserUID,
        username: name,
        permanent: true,
        timestamp: serverTimestamp(),
      });
      return;
    }

    // Temporary 7 day ban after 3 reports
    await setDoc(banRef, {
      uid: currentUserUID,
      username: name,
      weekBanCount,
      banExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      timestamp: serverTimestamp(),
    });
  } else {
    // Up report count if less than 3 (not at ban yet)
    if (banSnap.exists()) {
      await updateDoc(banRef, { reportCount, uid: currentUserUID, username: name});
    } else {
      await setDoc(banRef, { reportCount, weekBanCount: 0, uid: currentUserUID, username: name})
    }
  }
};

// Open report modal
const openReportModal = (user, msgId, chatType) => {
  if (user === username.value) return;
  reportedUser.value = user;
  reportedMessageId.value = msgId;
  reportedChatType.value = chatType;
  reportReason.value = "";
  showReportModal.value = true;
}; 

// Close report modal
const closeModal = () => {
  showReportModal.value = false;
  reportReason.value = "";
  reportedUser.value = "";
  reportedMessageId.value = "";
  reportedChatType.value = "";
};

// Submit report to firestore
const submitReport = async () => {
  if (!reportReason.value.trim()) {
    alert("Please explain your report before submitting.")
    return
  }

  try {
    await addDoc(collection(db, "reports"), {
      reportedUser: reportedUser.value,
      reportedBy: auth.currentUser.displayName,
      reportedByUID: auth.currentUser.uid,
      messageId: reportedMessageId.value,
      chatType: reportedChatType.value,
      reason: reportReason.value.trim(),
      timestamp: serverTimestamp()
    });

    if (reportedChatType.value === "public") {
      await incrementReportCountPublic(reportedUser.value);
    }
    alert(`Your report has been submitted.`)
    closeModal()
  } catch (err) {
    console.error("Failed to submit report:", err)
    alert("There was a problem submitting your report.")
  }
}

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await user.reload();
      username.value = user.displayName;

      listenForBanChanges(username.value);

      const q = query(collection(db, "publicMessages"), orderBy("timestamp", "asc"))
      onSnapshot(q, (snapshot) => {
        messages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      });
    }
  });
});

// Let users private chat after clicking on username
const goToPrivateChat = (targetUsername) => {
  // Don't allow chatting with self
  if (targetUsername === username.value) return;
  router.push(`/privateChat/${targetUsername}`);
}
</script>

<style scoped>
.card {
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
  border-radius: 12px;
}

.card-body > div {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.card-body > div:hover {
  background-color: #e9ecef;
}

.card::-webkit-scrollbar {
  width: 8px;
}

.card::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.1);
  border-radius: 4px;
}

strong.text-primary {
  cursor: pointer;
  user-select: none;
}

button.text-danger {
  font-size: 0.85rem;
  text-decoration: underline;
  background: none;
  border: none;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 1.25rem;
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
}

.alert {
  padding: 15px;
  border-radius: 8px;
  font-weight: bold;
}

.alert-danger {
  background-color: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
}
</style>