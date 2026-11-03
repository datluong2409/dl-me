/** All timings are in milliseconds. Values come from spec section 6.8 unless noted. */
export const MOTION = {
  triggerThreshold: 0.35,
  travel: { base: 350, perPx: 0.45, min: 350, max: 900, ease: [0.22, 1, 0.36, 1] },
  bend: { min: 0.08, max: 0.18 },
  draw: { min: 500, max: 700, ease: [0.16, 1, 0.3, 1] },
  drop: {
    min: 550,
    max: 800,
    ease: [0.22, 1, 0.36, 1],
    offsetMin: 60,
    offsetMax: 140,
    startScale: 0.96,
  },
  fadeIn: 180,
  ghostOut: 120,
  itemGap: 120,
  agentStagger: 140,
  idleAmplitude: { min: 40, max: 90 },
  /** Idle cursors stay inside the viewport: `margin` px from its edges; they re-home once it has been still for `settleAfter` ms. */
  roam: { margin: 100, settleAfter: 250, glide: 600 },
  /** An idle cursor with the pointer within `radius` px glides to a spot at least `distance` px away. */
  flee: { radius: 120, distance: 280, duration: 600, cooldown: 400, ease: [0.22, 1, 0.36, 1] },
  /** Short flights between nearby children (words of a paragraph, chips of a card). */
  hop: { base: 140, perPx: 0.4, min: 140, max: 520 },
  /** Typing: words fade in one after another; the cursor rides the newest word. */
  type: { perWord: 70, min: 250, max: 1100, lift: 3, ease: [0, 0, 1, 1] },
  /** Stamping a chip, badge or button into place. */
  stamp: { duration: 220, startScale: 0.85, ease: [0.22, 1, 0.36, 1] },
  /** With more than `full` items left, children speed up (down to 1/`max` of their time, never under `floor` ms per step). */
  pace: { full: 24, max: 2.5, floor: 60 },
  eligibleMargin: 100,
  /** Safety net (plan addition): a gesture that never finishes is snapped after this long. */
  gestureTimeout: 4000,
} as const
