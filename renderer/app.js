import { Pet3D } from './pet3d.js';
import { sfx } from './audio.js';

// DOM Elements
const petContainer = document.getElementById('pet-container');
const speechPill = document.getElementById('speech-pill');
const listeningHalo = document.getElementById('listening-halo');

// UI Pill Helper
let pillTimer = null;
function showPill(text, isListening = false, duration = 3500) {
  if (pillTimer) clearTimeout(pillTimer);
  speechPill.textContent = text;
  speechPill.classList.add('visible');
  if (isListening) {
    speechPill.classList.add('listening');
  } else {
    speechPill.classList.remove('listening');
  }

  if (duration > 0) {
    pillTimer = setTimeout(() => {
      speechPill.classList.remove('visible');
    }, duration);
  }
}

// Initialize 3D Pet
const pet = new Pet3D(petContainer);

// Initial friendly greeting
setTimeout(() => {
  pet.bounce();
  sfx.playHappy();
  showPill("Click me to speak! 🎙️", false, 4000);
}, 600);

// Voice Recognition State
let isListening = false;

async function startListening() {
  if (isListening) return;
  isListening = true;

  pet.setExpression('working');
  listeningHalo.classList.add('active');
  sfx.playChirp();
  showPill("Listening... 🎙️", true, 0);

  try {
    const res = await window.electronAPI.startVoiceRecognition();

    isListening = false;
    listeningHalo.classList.remove('active');

    if (res && res.success && res.text) {
      pet.spin();
      sfx.playExecute();
      showPill(res.actionResult || `Heard: "${res.text}"`, false, 4000);
    } else {
      pet.setExpression('default');
      showPill("No speech heard", false, 2500);
    }
  } catch (err) {
    isListening = false;
    listeningHalo.classList.remove('active');
    pet.setExpression('default');
    showPill("Error listening", false, 2500);
  } finally {
    setTimeout(() => {
      if (!isListening) pet.setExpression('default');
    }, 3000);
  }
}

// Listen for listening start event from main
if (window.electronAPI && window.electronAPI.onVoiceListeningStart) {
  window.electronAPI.onVoiceListeningStart(() => {
    showPill("Listening... 🎙️", true, 0);
  });
}

// Click vs Drag Detection
let isMouseDown = false;
let startX = 0, startY = 0;
let moved = false;

petContainer.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Left click only
  isMouseDown = true;
  moved = false;
  startX = e.clientX;
  startY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  const dx = Math.abs(e.clientX - startX);
  const dy = Math.abs(e.clientY - startY);
  if (dx > 4 || dy > 4) {
    moved = true;
    window.electronAPI.moveWindow(startX, startY);
  }
});

window.addEventListener('mouseup', () => {
  if (isMouseDown && !moved) {
    // CLICK DETECTED: Automatically activate voice acting!
    startListening();
  }
  isMouseDown = false;
});
