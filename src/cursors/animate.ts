import { animate } from 'motion'

export interface TweenOptions {
  /** Milliseconds. */
  duration: number
  ease: readonly [number, number, number, number]
  /** Called with eased progress from 0 to 1. */
  onUpdate(progress: number): void
  signal: AbortSignal
}

/** Resolves when the tween finishes or is aborted (it never rejects). */
export type Tween = (options: TweenOptions) => Promise<void>

export const motionTween: Tween = ({ duration, ease, onUpdate, signal }) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const controls = animate(0, 1, {
      duration: duration / 1000,
      ease: [...ease] as [number, number, number, number],
      onUpdate: (progress: number) => {
        if (!signal.aborted) onUpdate(progress)
      },
      onComplete: resolve,
    })
    signal.addEventListener(
      'abort',
      () => {
        controls.stop()
        resolve()
      },
      { once: true },
    )
  })
