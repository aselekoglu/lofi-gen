// app.js

console.log("RollingNumber available?", typeof RollingNumber !== "undefined");

document.body.addEventListener('click', async () => {
  await Tone.start(); // ✅ this will work if Tone is globally defined
  console.log('Tone.js started');
});
// Start Tone.js context
document.body.addEventListener('click', async () => {
    await Tone.start();
    console.log('Tone.js started');
});

// Instruments
const synth = new Tone.PolySynth().toDestination();
const kick = new Tone.MembraneSynth().toDestination();
const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
}).toDestination();
let kickOn = true;
let snareOn = true;
let chordsOn = true;

const keyPresets = {
  "C major": ["C", "D", "E", "F", "G", "A", "B"],
  "D major": ["D", "E", "F#", "G", "A", "B", "C#"],
  "A minor": ["A", "B", "C", "D", "E", "F", "G"],
  "E minor": ["E", "F#", "G", "A", "B", "C", "D"]
};

let currentChords = [];

function generateChordProgression(key, degrees) {
  const scale = keyPresets[key];
  return degrees.map(degree => {
    const root = scale[(degree - 1) % 7];
    return [root + "4", scale[(degree + 1) % 7] + "4", scale[(degree + 3) % 7] + "4"];
  });
}

function getChordName(scale, degree, keyName) {
  const root = scale[(degree - 1) % 7];
  const isMinor = keyName.includes("minor");

  // Basic triad classification based on major or minor key
  const minorDegrees = isMinor ? [1, 4, 5] : [2, 3, 6];
  const diminishedDegrees = isMinor ? [2, 7] : [7];

  if (diminishedDegrees.includes(degree)) return `${root}dim`;
  if (minorDegrees.includes(degree)) return `${root}m`;
  return `${root}`;
}

// Drum Loop
const drumLoop = new Tone.Loop((time) => {
  if (kickOn) kick.triggerAttackRelease("C1", "8n", time);
  if (snareOn) snare.triggerAttackRelease("8n", time + 0.5);
}, "1n");


// Chord Loop
let chordIndex = 0;
currentChords = generateChordProgression("C major", [1, 5, 6, 4]); // Default
const chordLoop = new Tone.Loop((time) => {
  if (chordsOn && currentChords.length > 0) {
    synth.triggerAttackRelease(currentChords[chordIndex % currentChords.length], "2n", time);
    chordIndex++;
  }
}, "2n");

// Start all loops
Tone.Transport.bpm.value = 80;
Tone.Transport.start();
drumLoop.start(0);
chordLoop.start(0);

// BPM control
const bpmSlider = document.getElementById("bpmSlider");
const bpmValue = document.getElementById("bpmValue");
bpmSlider.addEventListener("input", (e) => {
  const bpm = parseInt(e.target.value);
  bpmValue.textContent = bpm;
  Tone.Transport.bpm.value = bpm;
});

// Mute toggle
const muteButton = document.getElementById("muteButton");
let isMuted = false;
muteButton.addEventListener("click", () => {
  Tone.Destination.mute = !isMuted;
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔊 Unmute" : "🔇 Mute";
});

// Play/Pause
const playPauseButton = document.getElementById("playPauseButton");
let isPlaying = true;
playPauseButton.addEventListener("click", () => {
  if (isPlaying) {
    Tone.Transport.pause();
    playPauseButton.textContent = "▶ Resume";
  } else {
    Tone.Transport.start();
    playPauseButton.textContent = "⏸ Pause";
  }
  isPlaying = !isPlaying;
});

// Toggle Kick
const toggleKick = document.getElementById("toggleKick");
toggleKick.addEventListener("click", () => {
  kickOn = !kickOn;
  toggleKick.textContent = kickOn ? "🥁 Kick On" : "🥁 Kick Off";
});

// Toggle Snare
const toggleSnare = document.getElementById("toggleSnare");
toggleSnare.addEventListener("click", () => {
  snareOn = !snareOn;
  toggleSnare.textContent = snareOn ? "🥁 Snare On" : "🥁 Snare Off";
});

// Toggle Chords
const toggleChords = document.getElementById("toggleChords");
toggleChords.addEventListener("click", () => {
  chordsOn = !chordsOn;
  toggleChords.textContent = chordsOn ? "🎹 Chords On" : "🎹 Chords Off";
});

const keySelect = document.getElementById("keySelect");
// const progressionInput = document.getElementById("progressionInput");
const applyProgression = document.getElementById("applyProgression");
const chordNamesDisplay = document.getElementById("chordNamesDisplay");
const previewButton = document.getElementById("previewButton");

function displayChordNames(key, degrees) {
  const scale = keyPresets[key];
  const names = degrees.map(d => getChordName(scale, d, key));
  chordNamesDisplay.textContent = "Chords: " + names.join(" – ");
}

// Instead use custom elements directly

const rollers = document.querySelectorAll("layflags-rolling-number");

// Momentum/velocity-based scrolling for rollers
const rollerStates = new Map();

rollers.forEach((roller) => {
  rollerStates.set(roller, {
    velocity: 0,
    lastUpdate: performance.now(),
    animating: false,
    lastScrollTime: performance.now()
  });

  roller.addEventListener("wheel", (e) => {
    e.preventDefault();
    const state = rollerStates.get(roller);
    state.lastScrollTime = performance.now();

    state.velocity = e.deltaY * -0.005; // more responsive
    animateMomentum(roller, state);
  });
});

function animateMomentum(roller, state) {
  if (state.animating) return;
  state.animating = true;

  state.displayValue = parseFloat(roller.getAttribute("value"));

  function step() {
    const now = performance.now();
    const deltaTime = (now - state.lastUpdate) / 1000;
    state.lastUpdate = now;

    // stop if user hasn't scrolled recently
    if (now - state.lastScrollTime > 100) {
      state.velocity = 0;
    }

    state.displayValue += state.velocity * deltaTime * 10;
    state.displayValue = Math.max(1, Math.min(7, state.displayValue));
    const roundedValue = Math.round(state.displayValue);
    roller.setAttribute("value", roundedValue.toString());

    const duration = 300 + Math.abs(state.velocity) * 50;
    roller.style.setProperty('--roll-duration', `${duration}ms`);

    if (Math.abs(state.velocity) < 0.01 && Math.abs(state.displayValue - roundedValue) < 0.01) {
      roller.setAttribute("value", Math.round(state.displayValue).toString());
      state.animating = false;
      return;
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Add up/down buttons to each roller
rollers.forEach((roller, index) => {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.margin = "0 0.5rem";

  const upButton = document.createElement("button");
  upButton.textContent = "▲";
  upButton.style.marginBottom = "0.1rem";
  upButton.onclick = () => {
    const val = Math.min(7, parseInt(roller.getAttribute("value")) + 1);
    roller.setAttribute("value", val.toString());
  };

  const downButton = document.createElement("button");
  downButton.textContent = "▼";
  downButton.style.marginTop = "0.1rem";
  downButton.onclick = () => {
    const val = Math.max(1, parseInt(roller.getAttribute("value")) - 1);
    roller.setAttribute("value", val.toString());
  };

  const parent = roller.parentNode;
  parent.replaceChild(wrapper, roller);
  wrapper.appendChild(upButton);
  wrapper.appendChild(roller);
  wrapper.appendChild(downButton);
});

// Add live chord display on change
const observer = new MutationObserver(() => {
  const selectedKey = keySelect.value;
  const degrees = Array.from(rollers).map(r => parseInt(r.getAttribute("value")));
  displayChordNames(selectedKey, degrees);
});

rollers.forEach((roller) => {
  observer.observe(roller, { attributes: true, attributeFilter: ['value'] });
});

applyProgression.addEventListener("click", () => {
  const selectedKey = keySelect.value;
  const degrees = Array.from(rollers).map(r => parseInt(r.getAttribute("value")));
  currentChords = generateChordProgression(selectedKey, degrees);
  chordIndex = 0;
  displayChordNames(selectedKey, degrees);
});

previewButton.addEventListener("click", async () => {
  const selectedKey = keySelect.value;
  const degrees = Array.from(rollers).map(r => parseInt(r.getAttribute("value")));
  const previewChords = generateChordProgression(selectedKey, degrees);
  displayChordNames(selectedKey, degrees);

  for (let i = 0; i < previewChords.length; i++) {
    synth.triggerAttackRelease(previewChords[i], "2n", Tone.now() + i * 1.5);
  }
});

