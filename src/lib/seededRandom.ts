/**
 * Seeded pseudo-random number generator (mulberry32)
 * Produces deterministic sequences from a string seed,
 * so chart data stays stable across re-renders.
 */

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/** Returns a function that produces deterministic floats in [0, 1) */
export function seededRandom(seed: string): () => number {
  let state = hashString(seed)
  return () => {
    state |= 0
    state = (state + 0x6D2B79F5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
