/** Cinematic easing curves for the marketing experience. */

// Expo-out: a long, confident deceleration. The signature of the landing.
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Gentle ease-out for smaller UI moves.
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const REVEAL_VIEWPORT = { once: true, margin: '-12% 0px -12% 0px' } as const;
