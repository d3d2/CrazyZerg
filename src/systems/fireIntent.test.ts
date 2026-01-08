import { describe, expect, test } from 'vitest'
import { computeIsFiring } from './fireIntent'

describe('computeIsFiring', () => {
  test('LMB down => firing', () => {
    expect(computeIsFiring({ leftMouseDown: true, gameOver: false })).toBe(true)
  })
  test('game over => never firing', () => {
    expect(computeIsFiring({ leftMouseDown: true, gameOver: true })).toBe(false)
  })
})
