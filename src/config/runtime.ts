export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const RUNTIME_MODE: 'demo' | 'full' = DEMO_MODE ? 'demo' : 'full';

/**
 * Demo timings keep the interaction real while making a classroom or visitor
 * walkthrough practical. Full mode retains the validated study protocol.
 */
export const EXPERIMENT_TIMINGS = {
  calibrationMs: DEMO_MODE ? 1_500 : 3_000,
  stabilityMs: DEMO_MODE ? 5_000 : 15_000,
  tappingMs: DEMO_MODE ? 8_000 : 15_000,
  challengeOptionsSec: DEMO_MODE ? [10, 20] : [30, 60],
  defaultChallengeSec: DEMO_MODE ? 10 : 30,
  reactionTrials: DEMO_MODE ? 5 : 30,
  reactionMinDelayMs: DEMO_MODE ? 700 : 2_000,
  reactionMaxDelayMs: DEMO_MODE ? 1_800 : 10_000,
  starCatcherMs: DEMO_MODE ? 10_000 : 25_000
} as const;
