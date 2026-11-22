// Ember Court — a small seeded random source, so a match dealt from a
// seed always deals the same way. Screenshots and tests both lean on it.

// mulberry32: a tiny, well-behaved seeded generator. The seed is any
// 32-bit integer; the same seed always yields the same stream.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle a copy of an array with a seeded source, and return the copy.
// The input array is never changed.
export function seededShuffle(items, random) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const held = out[i];
    out[i] = out[j];
    out[j] = held;
  }
  return out;
}

// Pick one element of an array with a seeded source.
export function seededPick(items, random) {
  if (items.length === 0) return undefined;
  return items[Math.floor(random() * items.length)];
}

// A seeded integer in [0, max): a die roll the same seed always repeats.
export function randomInt(random, max) {
  return Math.floor(random() * max);
}
