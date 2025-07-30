// app.js

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

// Drum Loop
const drumLoop = new Tone.Loop((time) => {
    kick.triggerAttackRelease("C1", "8n", time);
    snare.triggerAttackRelease("8n", time + 0.5);
}, "1n");

// Chord Progression
const chords = [
    ["C4", "E4", "G4"],
    ["A3", "C4", "E4"],
    ["F3", "A3", "C4"],
    ["G3", "B3", "D4"]
];

let chordIndex = 0;
const chordLoop = new Tone.Loop((time) => {
    synth.triggerAttackRelease(chords[chordIndex % chords.length], "2n", time);
    chordIndex++;
}, "2n");

// Start all loops
Tone.Transport.bpm.value = 80;
Tone.Transport.start();
drumLoop.start(0);
chordLoop.start(0);
