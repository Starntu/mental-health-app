<script setup>
import { ref } from "vue"
import { db, auth } from "../firebase"
import { collection, addDoc, getDocs, query, orderBy, where, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const moods = [
    { emoji: "😊", label: "happy" },
    { emoji: "😢", label: "sad" },
    { emoji: "😡", label: "angry" },
    { emoji: "😴", label: "tired" },
    { emoji: "😰", label: "anxious" },
    { emoji: "😐", label: "neutral" },
]

const showForm = ref(false)
const selectedMood = ref("")
const journal = ref("")
const entries = ref([])

const showDeleteConfirm = ref(false)
const entryToDelete = ref(null)

const currentUser = ref(null)

const editingEntryId = ref(null)

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser.value = user
    await loadEntries(user.uid)
  }
})

async function loadEntries(uid) {
  const q = query(
    collection(db, "entries"),
    where("uid", "==", uid),             
    orderBy("timestamp", "desc")
  )
  const querySnapshot = await getDocs(q)
  entries.value = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  console.log("Entries loaded:", entries.value)
}

function selectMood(label) {
  selectedMood.value = label
}

async function submitEntry() {
  console.log("🚨 submitEntry triggered")
  if (!selectedMood.value) {
    alert("Please select a mood.")
    return
  }

  if (editingEntryId.value) {
    const id = editingEntryId.value
    const updatedData = {
      mood: selectedMood.value,
      journal: journal.value,
      lastEdited: Date.now()
    }

    await updateDoc(doc(db, "entries", id), updatedData)

    const index = entries.value.findIndex(e => e.id === id)
    if (index !== -1) {
      entries.value[index] = {
        ...entries.value[index],
        ...updatedData
      }
    }

    editingEntryId.value = null
  } else {
    const newEntry = {
      mood: selectedMood.value,
      journal: journal.value,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      uid: currentUser.value.uid
    }

    const docRef = await addDoc(collection(db, "entries"), newEntry)
    entries.value.unshift({ id: docRef.id, ...newEntry })
  }

  selectedMood.value = ""
  journal.value = ""
  showForm.value = false
}

function confirmDelete(entry) {
  showDeleteConfirm.value = true
  entryToDelete.value = entry
}

function cancelDelete() {
  showDeleteConfirm.value = false
  entryToDelete.value = null
}

async function deleteEntry() {
  try {
    const id = entryToDelete.value.id
    if (entryToDelete.value.uid !== currentUser.value.uid) {
      alert("You can only delete your own entries.")
      return
    }
    await deleteDoc(doc(db, "entries", id))
    entries.value = entries.value.filter(e => e.id !== id)
    showDeleteConfirm.value = false
    entryToDelete.value = null
  } catch (err) {
    console.error("Failed to delete:", err.message)
  }
}

function startEditing(entry) {
  selectedMood.value = entry.mood
  journal.value = entry.journal
  editingEntryId.value = entry.id
  showForm.value = true
}
</script>


<template>
    <div class="tracker">
        <button class="add-btn" @click="showForm = true">➕</button>

        <div v-if="showForm" class="overlay">
            <form id="tracker-form" @submit.prevent="submitEntry">
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

                <textarea v-model="journal" placeholder="Optional journal entry..."></textarea>
                <button type="submit" :disabled="!selectedMood">{{ editingEntryId ? "Update" : "Submit" }}</button>
            </form>
        </div>

        <div class="entries">
            <div v-for="entry in entries" :key="entry.id" class="entry">
                <span>{{ entry.date }} - {{ entry.mood }}</span>
                <p v-if="entry.journal">{{ entry.journal }}</p>

                <p v-if="entry.lastEdited">
                    <em>Last edited on {{ new Date(entry.lastEdited).toLocaleDateString() }}</em>
                </p>

                <button @click="confirmDelete(entry)">🗑</button>
                <button @click="startEditing(entry)">✏️</button>
            </div>
        </div>

        <div v-if="showDeleteConfirm" class="modal">
            <div class="modal-content">
                <p>❗ <strong>Are you sure you want to delete this entry?</strong><br>This action <strong>cannot be undone</strong>.</p>
                <button @click="deleteEntry">Yes, delete it</button>
                <button @click="cancelDelete">Cancel</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.emojis span.selected {
  border: 2px solid #4CAF50;
  border-radius: 8px;
  background-color: #e6ffe6;
  padding: 4px;
}
</style>