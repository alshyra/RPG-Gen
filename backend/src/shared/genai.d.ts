// Ambient module declaration so TypeScript won't error when the optional
// '@google/genai' SDK is not installed. This file allows us to do a dynamic
// import at runtime without requiring type declarations at build time.

declare module '@google/genai';
