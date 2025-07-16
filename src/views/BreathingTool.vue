<template>
  <div class="breathing-tool">
    <h2 class="title">Breathing Tool</h2>

    <div class="circle" :class="animationClass">
      <p>{{ currentPhase }}</p>
      <p class="countdown">{{ countdown }}</p>
    </div>

    <div class="controls">
      <button @click="start" :disabled="isRunning">Start</button>
      <button @click="pause" :disabled="!isRunning || paused">Pause</button>
      <button @click="resume" :disabled="!paused">Continue</button>
      <button @click="end" :disabled="!isRunning">End</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// List of breathing phases, current phase being stored, and each phase set to 3 seconds
const phases = ['Inhale', 'Hold', 'Exhale']
const currentPhase = ref('')
const countdown = ref(3)

// Track if the countdown is running or its been paused
const isRunning = ref(false)
const paused = ref(false)

// Track current phase (0 = inhale, 1 = hold, 2 = exhale)
let phaseIndex = 0
// Will hold interval timer and timeout timer
let countdownTimer = null
let phaseTimer = null

// Amount of time in each phase in milliseconds
let remainingTime = 3000
// Will store timestamp when the current phase started 
let phaseStartTime = null
// Will store the exact time user paused
let pauseTime = null

// If the countdown isnt running or is paused, theres no animation for the circle, otherwise return current phase
const animationClass = computed(() => {
  if (!isRunning.value || paused.value) return ''
  return currentPhase.value.toLowerCase() 
})

// Function that starts the timer
function start() {
  isRunning.value = true
  paused.value = false
  phaseIndex = 0
  remainingTime = 3000
  runPhase()
}

// Function that pauses timer
function pause() {
  // Stop both timers
  clearInterval(countdownTimer)
  clearTimeout(phaseTimer)
  // Set paused to true
  paused.value = true
  // Save timestamp of when user paused
  pauseTime = Date.now()

  // Calculate how far into phase the user was when they paused
  const elapsed = pauseTime - phaseStartTime
  // Calculate how much time is left in phase
  remainingTime = Math.max(0, 3000 - elapsed)
}

// Function that starts/resumes timer from where it was paused
function resume() {
  paused.value = false
  runPhase(true)
}

// Function to end timer and reset everything to default state
function end() {
  clearInterval(countdownTimer)
  clearTimeout(phaseTimer)
  isRunning.value = false
  paused.value = false
  countdown.value = 3
  currentPhase.value = ''
  remainingTime = 3000
}

// Function to start or resume a phase (if isResume is true)
function runPhase(isResume = false) {
  // Update current phase and record start time of the phase
  currentPhase.value = phases[phaseIndex]
  phaseStartTime = Date.now()

  // Convert milliseconds to seconds and display them for user
  let timeLeft = Math.ceil(remainingTime / 1000)
  countdown.value = timeLeft

  // Update the displayed countdown number every 0.2 seconds
  countdownTimer = setInterval(() => {
    const elapsed = Date.now() - phaseStartTime
    countdown.value = Math.max(0, Math.ceil((remainingTime - elapsed) / 1000))
  }, 200)

  // Move to the next phase in the cycle if the timer isnt paused
  phaseTimer = setTimeout(() => {
    clearInterval(countdownTimer)
    phaseIndex = (phaseIndex + 1) % phases.length
    remainingTime = 3000
    if (!paused.value) runPhase()
  }, remainingTime)

  // If the phase is starting and not resuming, reset remaining Time
  if (!isResume) {
    remainingTime = 3000
  }
}
</script>

<style scoped>
.breathing-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', Roboto, sans-serif;
  padding: 2rem;
  min-height: 100vh;
  background: #f8fbff;
  color: #003366;
}

.title {
  font-size: 2rem;
  margin-bottom: 2rem;
  font-weight: 600;
}

.circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: #e0f0ff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 0 25px rgba(0, 106, 255, 0.1);
  transition: transform 3s ease-in-out;
}

.inhale {
  animation: inhaleAnim 3s ease-in-out forwards;
}

.hold {
  animation: none;
}

.exhale {
  animation: exhaleAnim 3s ease-in-out forwards;
}

@keyframes inhaleAnim {
  0% { transform: scale(1); }
  100% { transform: scale(1.3); }
}

@keyframes exhaleAnim {
  0% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.countdown {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-top: 0.2rem;
}

.controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.controls button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 123, 255, 0.1);
  transition: background-color 0.3s, transform 0.2s;
}

.controls button:hover:not(:disabled) {
  background-color: #0066d4;
  transform: translateY(-2px);
}

.controls button:disabled {
  background-color: #bcd9f8;
  cursor: not-allowed;
}
</style>