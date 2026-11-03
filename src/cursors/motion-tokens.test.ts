import { MOTION } from './motion-tokens'

describe('MOTION tokens', () => {
  it('match the spec table (section 6.8) and the plan additions', () => {
    expect(MOTION).toEqual({
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
      roam: { settleAfter: 250, glide: 600 },
      roost: {
        edge: 48,
        gap: 16,
        tries: 80,
        minRoom: 24,
        maxRoom: 120,
        drift: 0.45,
        recheck: 500,
        footprint: { width: 72, height: 36 },
      },
      flee: { radius: 120, distance: 280, duration: 600, cooldown: 400, ease: [0.22, 1, 0.36, 1] },
      hop: { base: 140, perPx: 0.4, min: 140, max: 520 },
      type: { perWord: 70, min: 250, max: 1100, lift: 3, ease: [0, 0, 1, 1] },
      stamp: { duration: 220, startScale: 0.85, ease: [0.22, 1, 0.36, 1] },
      pace: { full: 24, max: 2.5, floor: 60 },
      eligibleMargin: 100,
      gestureTimeout: 4000,
    })
  })
})
