<template>
  <div class="tracker">
    <button class="add-btn" @click="showForm = true">➕</button>

    <div v-if="showForm" class="overlay">
      <form id="tracker-form" @submit.prevent="submitEntry">
        <button type="button" class="close-btn" @click="cancelForm">✖</button>

        <h2>{{ editingEntryId ? "Edit Your Mood" : "Select Your Mood" }}</h2>

        <div class="emojis">
          <span
            v-for="m in moods"
            :key="m.label"
            :class="{ selected: selectedMood === m.label }"
            @click="selectMood(m.label)"
          >
            {{ m.emoji }}
          </span>
        </div>

        <textarea
          v-model="journal"
          placeholder="Optional journal entry..."
        ></textarea>

        <button type="submit" :disabled="!selectedMood">
          {{ editingEntryId ? "Update" : "Submit" }}
        </button>
      </form>
    </div>

    <div class="entries">
      <div v-for="entry in entries" :key="entry.id" class="entry">
        <span class="entry-header">
          <span class="entry-emoji">{{
            moods.find((m) => m.label === entry.mood)?.emoji
          }}</span>
          <span class="entry-date">{{ entry.date }}</span>
        </span>

        <p v-if="entry.journal">{{ entry.journal }}</p>
        <p v-if="entry.lastEdited">
          <em
            >Last edited on
            {{ new Date(entry.lastEdited).toLocaleDateString() }}</em
          >
        </p>

        <button @click="confirmDelete(entry)">🗑</button>
        <button @click="startEditing(entry)">✏️</button>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal">
      <div class="modal-content">
        <p>
          ❗ <strong>Are you sure you want to delete this entry?</strong
          ><br />This action <strong>cannot be undone</strong>.
        </p>
        <button @click="deleteEntry">Yes, delete it</button>
        <button @click="cancelDelete">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { moods } from "../utils/moods.js";

// Reactive variables
const showForm = ref(false);
const selectedMood = ref("");
const journal = ref("");
const entries = ref([]);

// Show or hide the delete confirmation modal when necessary
const showDeleteConfirm = ref(false);
// The entry thats been selected to be deleted
const entryToDelete = ref(null);

// Info of current logged in user
const currentUser = ref(null);

// The ID of the entry being edited if editing
const editingEntryId = ref(null);

// Listen for when the user logs in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser.value = user;
    // Load users entries from Firebase
    await loadEntries(user.uid);
  }
});

// Function to load users previous entries
async function loadEntries(uid) {
  const q = query(
    collection(db, "entries"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
  );
  const querySnapshot = await getDocs(q);
  entries.value = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  console.log("Entries loaded:", entries.value);
}

// Function that selects mood when user clicks emoji
function selectMood(label) {
  selectedMood.value = label;
}

// Function to sumbit entry, new or edited
async function submitEntry() {
  console.log("🚨 submitEntry triggered");
  if (!selectedMood.value) {
    alert("Please select a mood.");
    return;
  }

  if (editingEntryId.value) {
    const id = editingEntryId.value;
    const updatedData = {
      mood: selectedMood.value,
      journal: journal.value,
      lastEdited: Date.now(),
    };

    await updateDoc(doc(db, "entries", id), updatedData);

    const index = entries.value.findIndex((e) => e.id === id);
    if (index !== -1) {
      entries.value[index] = {
        ...entries.value[index],
        ...updatedData,
      };
    }

    editingEntryId.value = null;
  } else {
    const newEntry = {
      mood: selectedMood.value,
      journal: journal.value,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      uid: currentUser.value.uid,
    };

    const docRef = await addDoc(collection(db, "entries"), newEntry);
    entries.value.unshift({ id: docRef.id, ...newEntry });
  }

  // Reset form
  selectedMood.value = "";
  journal.value = "";
  showForm.value = false;
}

// Show delete confirmation modal for entry
function confirmDelete(entry) {
  showDeleteConfirm.value = true;
  entryToDelete.value = entry;
}

// Function if user cancels deletion
function cancelDelete() {
  showDeleteConfirm.value = false;
  entryToDelete.value = null;
}

// Function that deletes entry and updates interface
async function deleteEntry() {
  try {
    const id = entryToDelete.value.id;
    if (entryToDelete.value.uid !== currentUser.value.uid) {
      alert("You can only delete your own entries.");
      return;
    }
    await deleteDoc(doc(db, "entries", id));
    entries.value = entries.value.filter((e) => e.id !== id);
    showDeleteConfirm.value = false;
    entryToDelete.value = null;
  } catch (err) {
    console.error("Failed to delete:", err.message);
  }
}

// Function to start editing an already existing entry
function startEditing(entry) {
  selectedMood.value = entry.mood;
  journal.value = entry.journal;
  editingEntryId.value = entry.id;
  showForm.value = true;
}

// Function to cancel editing an entry or creating a new entry
function cancelForm() {
  selectedMood.value = "";
  journal.value = "";
  editingEntryId.value = null;
  showForm.value = false;
}
</script>

<style scoped>
.tracker {
  padding: 2rem;
  position: relative;
  color: #ffe5f1;
}

.add-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  font-size: 2rem;
  background: linear-gradient(145deg, #7b3aed, #9d4edd);
  border: none;
  border-radius: 50%;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  color: #ffe5f1;
  z-index: 15;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.3s ease;
}
.add-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

#tracker-form {
  background: rgba(123, 58, 237, 0.85);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
  color: #ffe5f1;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

#tracker-form h2 {
  margin-bottom: 1.2rem;
  font-weight: 700;
  background: linear-gradient(90deg, #ff3eb0, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.emojis {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.emojis span {
  font-size: 1.8rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: 0.2s ease;
  background: rgba(255, 255, 255, 0.15);
}
.emojis span:hover {
  background: rgba(255, 255, 255, 0.25);
}
.emojis span.selected {
  border: 2px solid #ffd700;
  background-color: rgba(255, 182, 255, 0.3);
}

textarea {
  width: 100%;
  min-height: 100px;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  margin: 1rem 0;
  resize: vertical;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.25);
  color: #ffe5f1;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.2);
  transition:
    background 0.3s,
    box-shadow 0.3s;
}
textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.25);
}

#tracker-form button[type="submit"] {
  width: 100%;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 12px;
  padding: 0.75rem;
  background: linear-gradient(145deg, #7b3aed, #9d4edd);
  color: #ffe5f1;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}
#tracker-form button[type="submit"]:hover {
  background: linear-gradient(145deg, #9d4edd, #7b3aed);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}

.entries {
  padding: 2rem 1rem;
  max-width: 700px;
  margin: 0 auto;
}

.entry {
  background: #7b3aed;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  color: #ffe5f1;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}
.entry:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

.entry-header {
  display: flex;
  align-items: center;
}

.entry-emoji {
  font-size: 2rem;
}

.entry-date {
  font-size: 1rem;
  margin-left: 0.75rem;
  color: #ffd700;
}

.entry p {
  margin-top: 0.5rem;
}

.entry button {
  margin-left: 0.5rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #ffe5f1;
  transition: color 0.2s;
}
.entry button:hover {
  color: #ffb347;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #ffe5f1;
  transition: color 0.2s ease;
  z-index: 11;
}
.close-btn:hover {
  color: #ffb347;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.modal-content {
  background: #7b3aed;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  color: #ffe5f1;
}
.modal-content p {
  margin-bottom: 1.5rem;
}
.modal-content button {
  margin: 0 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.3s ease;
}
.modal-content button:first-child {
  background-color: #ef4444;
  color: white;
}
.modal-content button:first-child:hover {
  background-color: #dc2626;
}
.modal-content button:last-child {
  background-color: #9d4edd;
}
.modal-content button:last-child:hover {
  background-color: #7b3aed;
}
</style>
