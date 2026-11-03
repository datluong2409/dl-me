import { activeAgents } from './agents'
import { dropOffset, isEligible, isTriggered, nextItem, sectionAction } from './scheduler'
import type { ItemStatus } from './types'

describe('isTriggered', () => {
  it('triggers a section that fills the viewport', () => {
    expect(isTriggered({ top: 0, bottom: 900 }, 900)).toBe(true)
  })

  it('needs 35% of the viewport for a section taller than the viewport', () => {
    expect(isTriggered({ top: 600, bottom: 3600 }, 900)).toBe(false) // 300px < 315px
    expect(isTriggered({ top: 500, bottom: 3500 }, 900)).toBe(true) // 400px >= 315px
  })

  it('triggers a short section at the bottom of the page once it is fully visible', () => {
    expect(isTriggered({ top: 600, bottom: 900 }, 900)).toBe(true)
  })

  it('does not trigger sections entirely below or above the viewport', () => {
    expect(isTriggered({ top: 900, bottom: 1200 }, 900)).toBe(false)
    expect(isTriggered({ top: -300, bottom: 0 }, 900)).toBe(false)
  })
})

describe('sectionAction', () => {
  it('skips a section that is entirely above the viewport', () => {
    expect(sectionAction({ top: -500, bottom: 0 }, 900)).toBe('skip')
  })

  it('waits while too little of the section is visible', () => {
    expect(sectionAction({ top: -200, bottom: 100 }, 900)).toBe('wait') // 100px < 105px
    expect(sectionAction({ top: 900, bottom: 1500 }, 900)).toBe('wait')
  })

  it('triggers when enough is visible', () => {
    expect(sectionAction({ top: 0, bottom: 900 }, 900)).toBe('trigger')
  })
})

describe('isEligible', () => {
  it('uses a 100px margin around the viewport', () => {
    expect(isEligible({ top: 999, bottom: 1200 }, 900)).toBe(true)
    expect(isEligible({ top: 1000, bottom: 1200 }, 900)).toBe(false)
    expect(isEligible({ top: -300, bottom: -99 }, 900)).toBe(true)
    expect(isEligible({ top: -300, bottom: -100 }, 900)).toBe(false)
  })
})

describe('nextItem', () => {
  const item = (id: string, order: number, status: ItemStatus) => ({ id, order, status })

  it('picks the lowest order among pending, eligible items', () => {
    const items = [item('c', 3, 'pending'), item('a', 1, 'running'), item('b', 2, 'pending'), item('d', 0, 'done')]
    expect(nextItem(items, () => true)?.id).toBe('b')
  })

  it('skips ineligible items', () => {
    const items = [item('a', 1, 'pending'), item('b', 2, 'pending')]
    expect(nextItem(items, (i) => i.id === 'b')?.id).toBe('b')
  })

  it('uses a custom order when one is given', () => {
    const items = [item('a', 1, 'pending'), item('b', 2, 'pending')]
    expect(nextItem(items, () => true, (i) => -i.order)?.id).toBe('b')
  })

  it('returns undefined when nothing can start', () => {
    expect(nextItem([item('a', 1, 'done')], () => true)).toBeUndefined()
    expect(nextItem([item('a', 1, 'pending')], () => false)).toBeUndefined()
    expect(nextItem([], () => true)).toBeUndefined()
  })
})

describe('dropOffset', () => {
  it('has a length between 60 and 140 and is stable', () => {
    for (let order = 0; order < 24; order++) {
      const { x, y } = dropOffset(order)
      const length = Math.hypot(x, y)
      expect(length).toBeGreaterThanOrEqual(60 - 1e-9)
      expect(length).toBeLessThanOrEqual(140 + 1e-9)
      expect(dropOffset(order)).toEqual({ x, y })
    }
  })

  it('differs between neighbouring orders', () => {
    expect(dropOffset(1)).not.toEqual(dropOffset(2))
  })
})

describe('activeAgents', () => {
  it('uses three agents below 768px and six from 768px', () => {
    expect(activeAgents(767).map((a) => a.id)).toEqual(['mai', 'kai', 'linh'])
    expect(activeAgents(768)).toHaveLength(6)
  })
})
