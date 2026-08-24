import { describe, expect, it } from 'vitest'
import {
  lookupRegionalSoil,
  toRegionalSoilData,
} from './regionalSoilFallback'

describe('lookupRegionalSoil hierarchy', () => {
  it('matches a city entry within its state', () => {
    const match = lookupRegionalSoil('Maharashtra', 'Nagpur')
    expect(match?.matchedLevel).toBe('city')
    expect(match?.entry.textureClass).toBe('Clay loam')
  })

  it('resolves city aliases (Mumbai / Bombay)', () => {
    const match = lookupRegionalSoil('Maharashtra', 'bombay')
    expect(match?.matchedLevel).toBe('city')
    expect(match?.entry.city).toBe('Mumbai')
  })

  it('falls back to the state entry for unknown cities', () => {
    const match = lookupRegionalSoil('Madhya Pradesh', 'Unknown Town')
    expect(match?.matchedLevel).toBe('state')
    expect(match?.entry.textureClass).toBe('Clay')
  })

  it('normalises legacy/alternate state names', () => {
    expect(lookupRegionalSoil('Orissa', null)?.entry.state).toBe('Odisha')
    expect(lookupRegionalSoil('Uttaranchal', null)?.entry.state).toBe('Uttarakhand')
  })

  it('falls back to the all-India default when nothing matches', () => {
    const match = lookupRegionalSoil('Atlantis', 'Nowhere City')
    expect(match?.matchedLevel).toBe('india')
    expect(match?.entry.textureClass).toBe('Loam')
  })
})

describe('toRegionalSoilData', () => {
  it('produces SoilData-compatible fallback with honest provenance', () => {
    const match = lookupRegionalSoil('Maharashtra', 'Pune')!
    const data = toRegionalSoilData(match)
    expect(data.provider).toBe('regional-fallback')
    expect(data.sourceLabel).toBe('Regional fallback estimate')
    expect(data.textureClass).toBe('Clay loam')
    expect(data.clayPct).toBe(28)
    expect(data.sandPct).toBeNull()
    expect(data.matchNote).toContain('Matched city entry: Pune')
  })

  it('carries the India-default note through', () => {
    const match = lookupRegionalSoil(null, null)!
    const data = toRegionalSoilData(match)
    expect(data.matchNote).toContain('All-India composite default')
  })
})
