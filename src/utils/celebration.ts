import confetti from 'canvas-confetti';

/** A brief, non-blocking acknowledgement for completed study tasks. */
export function celebrateTaskCompletion(): void {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confetti({ particleCount: 36, spread: 52, startVelocity: 28, origin: { x: 0.34, y: 0.68 }, colors: ['#06b6d4', '#22c55e', '#facc15'] });
  window.setTimeout(() => confetti({ particleCount: 28, spread: 48, startVelocity: 24, origin: { x: 0.66, y: 0.68 }, colors: ['#38bdf8', '#a78bfa', '#f59e0b'] }), 130);
}
