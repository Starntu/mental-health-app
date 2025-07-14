<template>
    <div class="dashboard">
        <h1 class="title">Mood Dashboard</h1>

        <section class="card">
            <h2>Weekly Mood Chart</h2>
            <div v-if="noWeeklyData" class="no-data-message">
              <p>📭 No entries this week yet. Your mood chart will appear here once you log some!</p>
            </div>
            <div v-else>
              <Pie :data="chartData" :options="chartOptions"/> 
            </div>
        </section>

        <section class="card">
            <h2>Mood Streaks</h2>
            <p>🔥 Current streak: <span class="streak-number">{{ currentStreak }}</span> days</p>
            <p>🏆 Longest streak: <span class="streak-number">{{ longestStreak }}</span> days</p>
        </section>

        <section class="card">
            <h2>Entry Stats</h2>
            <p>📝 Total Entries: {{ entryStats.total }}</p>
            <p>📆 First Entry: {{ entryStats.first || "No entries yet" }}</p>
            <p>⏱ Most Recent Entry: {{ entryStats.recent || "No entries yet" }}</p>
        </section>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { moods } from "../utils/moods.js";
import { Pie } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Keep track of the current day reactively
const currentDate = ref(new Date())

// Repeatedy check every minute
setInterval(() => {
  // Check the current date every minute
  const now = new Date()
  // Check the current date to the last stored date, if the last stored date is different, update it
  if (now.toDateString() !== currentDate.value.toDateString()) {
    currentDate.value = now
  }
}, 60000)

// Function to get current week
function getWeek(baseDate) {
  // Get the current date and day of the week
  const now = new Date(baseDate)
  const day = now.getDay() // now.getDay gives each day of the week a number

  // Figure out the date for the start of the week
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - day) // Set the date of sunday by subtracting the current date of the month by the day of the week
  sunday.setHours(0, 0, 0, 0)

  // An array to hold the dates of the week
  const weekDates = []

  // Starting from sundays date, add a day to the date 6 times until you reach Satuday for a total of 7 days  
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + i)
    // Format each date to M/D/YYYY
    const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    weekDates.push(dateString)
  }

  return weekDates
}

// Keeping the array of dates updated 
const weekDates = computed(() => getWeek(currentDate.value))

// Array to store users mood entries
const entries = ref([])

// If theres a user, get the correct entries from them and save 
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const q = query(
        collection(db, "entries"),
        where("uid", "==", user.uid),
        orderBy("timestamp", "desc")
      )
      const querySnapshot = await getDocs(q)
      entries.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }
  })
})

// Initate the mood counts for the week and first set all counts to 0
const weeklyMoodCounts = computed(() => {
  const counts = {}
  moods.forEach(m => (counts[m.label] = 0))

  // Only include entries from the week
  const currentWeekEntries = entries.value.filter(entry =>
    weekDates.value.includes(entry.date)
  )

  // Go through each entry and update count (starts at 0 in case the mood was initated)
  currentWeekEntries.forEach(entry => {
    counts[entry.mood] = (counts[entry.mood] || 0) + 1
  })

  return counts
})

// Check if the user has no entries for the week and return value
const noWeeklyData = computed(() => {
  const counts = Object.values(weeklyMoodCounts.value)
  return !counts.some(count => count > 0)
})

// Register chart features that"ll be used
ChartJS.register(Title, Tooltip, Legend, ArcElement)

const chartData = computed(() => {
  // Get the labels and data for the chart
  const labels = moods.map(m => m.emoji)
  const data = moods.map(m => weeklyMoodCounts.value[m.label])

  // Return chart attributes /  structure
  return {
    labels,
    datasets: [
      {
        label: "Weekly Mood Distribution",
        backgroundColor: [
          "#fbbf24", // happy
          "#60a5fa", // sad
          "#f87171", // angry
          "#a78bfa", // tired
          "#34d399", // anxious
          "#d1d5db"  // neutral
        ],
        data,
        borderWidth: 1,
      },
    ],
  }
})

// Chart appearance
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "right",
      labels: {
        font: { size: 14 }
      }
    },
    tooltip: {
      callbacks: {
        title: () => '',
        label: context => {
          const label = context.label || ""
          const value = context.raw || 0
          return `${label}: ${value} mood${value === 1 ? "" : "s"}`
        }
      }
    }
  }
}

// For mood streak
// Get all the mood entry dates
const moodDates = computed(() => {
  // Get the dates from the entries, no duplicates
  const datesSet = new Set(entries.value.map(e => e.date));
  const sortedDates = Array.from(datesSet).sort((a, b) => {
    return new Date(b) - new Date(a); // Sort dates by newest to oldest
  });

  return sortedDates;
});

// Current streak
const currentStreak = computed(() => {
  let streak = 0;
  // Get the sorted list of mood dates and get current date
  const dateList = moodDates.value;
  let today = new Date();
  
  // Check previous day starting from today until theres a day with no mood entry
  while (true) {
    const dateString = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    // If the user logged an entry on the current date add to streak
    if (dateList.includes(dateString)) {
      streak++;
      // Go back one day to check previous dates from current date
      today.setDate(today.getDate() - 1);
    } else {
      break; // end streak if theres a day with no entry
    }
  }

  return streak;
});

// Track users longest streak
const longestStreak = computed(() => {
  const dateList = moodDates.value
    .map(d => new Date(d))
    .sort((a, b) => a - b); // Sort entry dates from oldest to newest

  let maxStreak = 0;
  // The current streak should be 1 if theres at least an entry, otherwise 0
  let current = dateList.length > 0 ? 1 : 0; 

  // Loop through each date starting from the 2nd date (to compare it to the date before it)
  for (let i = 1; i < dateList.length; i++) {
    // Calculate the differences in days between the current date and previous date, converting millesconds to days
    const diff = (dateList[i] - dateList[i - 1]) / (1000 * 60 * 60 * 24);
    // If the current date is 1 day after the previous one increase the strak
    if (diff === 1) {
      current++;
    // If the gap between the current date and previous date is more than 1 break the streak
    } else if (diff > 1) {
      // Save the current streak to maxStreak if its the longest so far and then reset current
      maxStreak = Math.max(maxStreak, current);
      current = 1;
    }
  }

  // Return the longest streak (might be the current streak that hasn't been broken yet)
  return Math.max(maxStreak, current); 
});

// For entry stats
const entryStats = computed(() => {
  // Case for if there are no entries
  if (entries.value.length === 0) {
    return {
      total: 0,
      first: null,
      recent: null,
    }
  }

  // Sort entries by oldest to newest (using a shallow copy)
  const sortedByTime = [...entries.value].sort((a, b) => a.timestamp - b.timestamp)

  // Return entry stats, total number, and date of the first and most recent entry
  return {
    total: entries.value.length,
    first: sortedByTime[0].date,
    recent: sortedByTime[sortedByTime.length - 1].date,
  }
})
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  font-family: "Segoe UI", sans-serif;
  color: #1f2937;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  color: #3b82f6;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: scale(1.01);
}

.card h2 {
  font-size: 1.5rem;
  color: #111827;
  margin-bottom: 1rem;
  border-left: 4px solid #3b82f6;
  padding-left: 0.75rem;
}

.card p {
  font-size: 1.1rem;
  margin: 0.5rem 0;
  color: #374151;
}

canvas {
  max-width: 100%;
  margin: 1rem auto;
  display: block;
}

.streak-number {
  font-weight: bold;
  color: #f59e0b; /* golden color */
  font-size: 1.2em;
}

.entry-stats {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.entry-stats p {
  font-size: 1rem;
  margin: 0.5rem 0;
}

.no-data-message {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 1rem;
}
</style>

