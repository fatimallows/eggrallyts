import { WorldUtils, EggUtils, EggnemiesUtils } from '../src/model'
import { it, describe, expect } from 'vitest'

describe('WorldUtils', () => {
  it('should calculate top, bottom, left, right correctly', () => {
    const world = { x: 10, y: 20, width: 100, height: 200 }
    expect(WorldUtils.top(world)).toBe(20)
    expect(WorldUtils.bottom(world)).toBe(220)
    expect(WorldUtils.left(world)).toBe(10)
    expect(WorldUtils.right(world)).toBe(110)
  })
})