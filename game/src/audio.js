// Ember Court — tiny synthesized WebAudio blips, and nothing else.
// No audio files ship with the game: every sound is a few oscillators
// shaped in code. Everything is guarded, so a browser without audio
// still plays the game in silence.

let context = null;
let muted = false;

// Is sound on? The M key and the mute button flip this.
export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = Boolean(value);
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// Warm the audio up inside a user gesture, so the first blip is not
// late: call this once on the first pointer press.
export function primeAudio() {
  const ctx = audioContext();
  if (ctx !== null && ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
}

// The shared AudioContext, made lazily on the first sound (after a user
// gesture, when the browser allows it) and never again.
function audioContext() {
  if (context !== null) return context;
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  } catch {
    context = null;
  }
  return context;
}

// Play one short tone: a sine blip at `frequency` for `duration`
// seconds, fading out so it never clicks.
function blip(frequency, startAt, duration, volume) {
  const ctx = audioContext();
  if (ctx === null) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startAt);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + startAt);
    oscillator.stop(ctx.currentTime + startAt + duration + 0.05);
  } catch {
    // A browser that refuses audio must never break the game.
  }
}

// A short phrase: notes played one after another from `startAt`.
function phrase(notes, step, duration, volume) {
  notes.forEach((frequency, index) => {
    blip(frequency, index * step, duration, volume);
  });
}

// The five named sounds the game uses.
export const sounds = {
  // A click when a card is played.
  play() {
    if (muted) return;
    blip(660, 0, 0.09, 0.16);
  },
  // A rising pair when the player takes a trick.
  trickWon() {
    if (muted) return;
    phrase([523.25, 783.99], 0.09, 0.14, 0.16);
  },
  // A falling pair when Rook takes one.
  trickLost() {
    if (muted) return;
    phrase([392.0, 311.13], 0.09, 0.14, 0.14);
  },
  // A four-note arpeggio for a match win.
  matchWon() {
    if (muted) return;
    phrase([523.25, 659.25, 783.99, 1046.5], 0.11, 0.22, 0.16);
  },
  // A falling four-note line for a loss.
  matchLost() {
    if (muted) return;
    phrase([392.0, 329.63, 261.63, 196.0], 0.11, 0.22, 0.14);
  },
};
