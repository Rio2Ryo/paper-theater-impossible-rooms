import { describe, expect, it } from 'vitest'
import { decodeState, defaultInteractions, encodeState, exportScenario, generateTheater, normalizeSeed } from './theater'

describe('paper theater generation', () => {
  it('generates deterministically from the same seed', () => {
    expect(generateTheater('velvet thunder library')).toEqual(generateTheater('velvet thunder library'))
  })

  it('normalizes weird input safely', () => {
    expect(normalizeSeed('<script>alert(1)</script>\n部屋が裏返る')).not.toContain('<')
    expect(normalizeSeed('')).toMatch(/paper door/)
  })

  it('round-trips URL state', () => {
    const encoded = encodeState('mirror soup attic', { ...defaultInteractions, curtainOpen: true, tabPull: 101 })
    const decoded = decodeState(encoded)
    expect(decoded?.seed).toBe('mirror soup attic')
    expect(decoded?.interactions.curtainOpen).toBe(true)
    expect(decoded?.interactions.tabPull).toBe(100)
  })

  it('rejects corrupt or excessive URL payloads', () => {
    expect(decodeState('not-base64%%%')).toBeNull()
    expect(decodeState('a'.repeat(1600))).toBeNull()
  })

  it('exports JSON scenario with generated room and clamped interactions', () => {
    const scenario = exportScenario('umbrella moon hallway', { moonDial: 999, floorSlide: -20 })
    expect(scenario.generated.title).toMatch(/^The /)
    expect(scenario.interactions.moonDial).toBe(360)
    expect(scenario.interactions.floorSlide).toBe(0)
  })
})
