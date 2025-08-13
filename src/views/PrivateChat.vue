<template>
  <div class="container mt-4">
    <h2 class="mb-4 text-primary">Chat with {{ targetUsername }}</h2>

    <!-- Ban notice for if user is banned -->
    <div v-if="isBanned" class="alert alert-danger text-center mb-3"> 
      <template v-if="banPermanent"> 
        You are <strong>permanently banned</strong> from private chat. 
      </template> 
      <template v-else> 
        You are banned from private chat for <strong>{{ remainingBanDays }}</strong> more day(s). 
      </template> 
    </div> 

    <div v-if="loading">Loading messages...</div>
    <!-- Chat messages -->
    <div v-else class="card p-3" style="max-height: 400px; overflow-y: auto;" ref="messagesContainer">
      <div class="card-body">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="{ 'text-end': message.sender === currentUser }"
        >
          <strong
            :class="{
              'text-primary': message.sender === currentUser,
              'text-success': message.sender !== currentUser,
            }"
          >
            {{ message.sender }}
          </strong>
          <p class="mb-2">{{ message.text }}</p>

          <!-- report button -->
          <button
            class="btn btn-link text-danger p-0 ms-2"
            @click="openReportModal(message.sender, message.id, 'private')"
          >🚩 Report</button>
        </div>
      </div>
    </div>

    <div class="input-group mt-3">
      <input
        type="text"
        v-model="newMessage"
        class="form-control"
        placeholder="Type a message"
        @keyup.enter="sendMessage"
        :disabled="isBanned"
      />
      <button class="btn btn-primary" @click="sendMessage" :disabled="isBanned">Send</button>
    </div>

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

<script>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Filter } from "bad-words";

export default {
  name: "PrivateChat",
  props: {
    targetUsername: String,
  },
  setup(props) {
    // Firebase and basic ref
    const db = getFirestore();
    const auth = getAuth();

    // Chat reactive variables
    const messages = ref([]);
    const newMessage = ref("");
    const currentUser = ref("");
    const loading = ref(true);
    const messagesContainer = ref(null)

    // Profanity filter
    const filter = new Filter();

    // Report modal reactive variables
    const showReportModal = ref(false);
    const reportReason = ref(""); 
    const reportedUser = ref(""); 
    const reportedMessageId = ref(""); 
    const reportedChatType = ref(""); 

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

    const getRoomId = (user1, user2) => {
      return [user1, user2].sort().join("_");
    };

    // Auto scroll to bottom on new messages
    watch(messages, async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });

    // Send a new message
    const sendMessage = async () => {
      if (!currentUser.value) return;

      // Stop user from sending messages when banned
      if (isBanned.value) {
        if (banPermanent.value) {
          alert("You are permanently banned from private chat and cannot send messages.");
        } else {
          alert(`You are banned from private chat for ${remainingBanDays.value} more day(s).`); 
        }
        return;
      }

      if (await checkBanStatusPrivate(currentUser.value)) return;
      
      if (!newMessage.value.trim()) return;

      const roomId = getRoomId(currentUser.value, props.targetUsername);
      // Filter profanity
      const cleanText = filter.clean(newMessage.value.trim());
      // Save message
      await addDoc(collection(db, "privateMessages", roomId, "messages"), {
        text: cleanText,
        sender: currentUser.value,
        timestamp: serverTimestamp(),
      });

      // Send notification to message recipient
      const targetUserDoc = await getDoc(doc(db, "usernames", props.targetUsername));
      if (targetUserDoc.exists()) {
        const targetUID = targetUserDoc.data().uid;

        await addDoc(collection(db, "notifications"), {
          to: targetUID,
          message: `${currentUser.value} messaged you privately`,
          read: false,
          timestamp: serverTimestamp(),
        });
      } else {
        console.warn("Could not find user UID for", props.targetUsername);
      }

      newMessage.value = "";
    };

    // Check if a user is banned from private chatting
    const checkBanStatusPrivate = async (name) => {
      const banRef = doc(db, "privateChatBans", name); 
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

    // Live ban changes in private chat
    const listenForBanChangesPrivate = (name) => {
      const banRef = doc(db, "privateChatBans", name); 
      onSnapshot(banRef, (docSnap) => {
        if (docSnap.exists()) {
          const banData = docSnap.data();
          const now = Date.now();
          if (banData.permanent) {
            isBanned.value = true; 
            banPermanent.value = true; 
            banExpiresTimestamp.value = null; 
            alert("You are permanently banned from private chat."); 
          } else if (banData.banExpires && banData.banExpires.toMillis() > now) {
            isBanned.value = true; 
            banPermanent.value = false; 
            banExpiresTimestamp.value = banData.banExpires; 
            const remainingDays = Math.ceil(
              (banData.banExpires.toMillis() - now) / (1000 * 60 * 60 * 24)
            );
            alert(`You are banned from private chat for ${remainingDays} more day(s).`); 
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

    // Keep track of and update report count for private chat ban
    const incrementReportCountPrivate = async (name) => {
      const currentUserUID = auth.currentUser.uid;
      const banRef = doc(db, "privateChatBans", name); 
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
          await updateDoc(banRef, { reportCount });
        } else {
          await setDoc(banRef, { reportCount, weekBanCount: 0, uid: currentUserUID, username: name, });
        }
      }
    }; 

    // Open report modal
    const openReportModal = (user, msgId, chatType) => {
      if (user === currentUser.value) return;
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
        alert("Please explain your report before submitting.");
        return;
      }

      try {
        await addDoc(collection(db, "reports"), {
          reportedUser: reportedUser.value,
          reportedBy: auth.currentUser.displayName,
          reportedByUID: auth.currentUser.uid,
          messageId: reportedMessageId.value,
          chatType: reportedChatType.value,
          reason: reportReason.value.trim(),
          timestamp: serverTimestamp(),
        });

        if (reportedChatType.value === "private") {
          await incrementReportCountPrivate(reportedUser.value);
        }

        alert("Your report has been submitted.");
        closeModal();
      } catch (err) {
        console.error("Failed to submit report:", err);
        alert("There was a problem submitting your report.");
      }
    };

    onMounted(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUser.value = user.displayName;

          listenForBanChangesPrivate(currentUser.value); 

          const roomId = getRoomId(currentUser.value, props.targetUsername);
          const messagesRef = collection(db, "privateMessages", roomId, "messages");
          const q = query(messagesRef, orderBy("timestamp"));

          onSnapshot(q, (snapshot) => {
            messages.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            loading.value = false;
          });
        }
      });
    });

    // Return variables
    return {
      messages,
      newMessage,
      currentUser,
      loading,
      sendMessage,
      closeModal,
      openReportModal,
      reportReason,
      showReportModal,
      submitReport,
      isBanned, 
      banPermanent, 
      remainingBanDays,
      checkBanStatusPrivate, 
    };
  },
};
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
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

strong.text-primary,
strong.text-success {
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