// Jest stub for expo-crypto: its native randomUUID() silently resolves to
// `undefined` under Jest (no thrown error, no warning — jest-expo mocks the
// native module to a no-op) rather than crashing, which is a real gotcha
// (see memory.md). A plain JS v4-shaped UUID generator gives tests real,
// distinct ids instead.
function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = { randomUUID };
