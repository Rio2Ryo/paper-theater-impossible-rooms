export type InteractionState = {
  curtainOpen: boolean
  tabPull: number
  wallOpen: boolean
  moonDial: number
  floorSlide: number
  backstage: boolean
}

export type Palette = {
  name: string
  ink: string
  paper: string
  glow: string
  shadow: string
  accent: string
}

export type GeneratedTheater = {
  seed: string
  seedHash: string
  title: string
  palette: Palette
  wallpaper: string
  resident: { name: string; role: string; request: string }
  props: string[]
  impossibleRule: string
  exitOmen: string
  secret: string
  stageDirection: string
  rarity: 'common' | 'odd' | 'rare'
}

const palettes: Palette[] = [
  { name: 'burnt peach eclipse', ink: '#2b1724', paper: '#ffe1ba', glow: '#ff8b6e', shadow: '#6b2942', accent: '#423a83' },
  { name: 'blueprint moth', ink: '#12213a', paper: '#dcecff', glow: '#7cc7ff', shadow: '#243b6a', accent: '#ffcc66' },
  { name: 'matcha séance', ink: '#1f2a1b', paper: '#edf5cf', glow: '#a6d96a', shadow: '#4d6234', accent: '#d76483' },
  { name: 'velvet receipt', ink: '#241225', paper: '#f7d6ef', glow: '#f477c8', shadow: '#532a67', accent: '#ffd05a' },
  { name: 'midnight stationery', ink: '#080d19', paper: '#d9d0b8', glow: '#96f0d8', shadow: '#1f3558', accent: '#f15946' },
]

const nouns = ['laundry cathedral', 'umbrella observatory', 'receipt forest', 'elevator chapel', 'moon pantry', 'staircase aquarium', 'velvet archive', 'paper furnace', 'telegram garden', 'clockless station']
const adjectives = ['folded', 'sleepwalking', 'inside-out', 'murmuring', 'magnetic', 'backwards', 'lantern-lit', 'unlicensed', 'tiny', 'weatherproof']
const residents = [
  ['Mina Quillmoth', 'paper moth archivist', 'stop the ceiling from remembering rain'],
  ['Dr. Button-Lantern', 'staircase veterinarian', 'teach the exits to purr in sequence'],
  ['Aiko Foldwell', 'backstage cartographer', 'find the door that only appears when ignored'],
  ['Pip Receiptson', 'goblin accountant of echoes', 'audit the shadows before they invoice the moon'],
  ['Nori Thimble', 'miniature stagehand', 'pull the floor one centimeter closer to tomorrow'],
]
const props = ['a bookmark staircase', 'a moon with visible hinges', 'three receipts pretending to be birds', 'a drawer full of weather', 'a teacup-sized trapdoor', 'a window looking into yesterday', 'an elevator button labeled maybe', 'a loyal shadow on a string', 'a postage stamp balcony', 'a lantern that edits gravity']
const rules = ['Opening any flap changes which wall is the floor.', 'Every prop casts the shadow of a different room.', 'The smallest door is the only door large enough to leave through.', 'Moonlight behaves like paper: fold it twice and it becomes a staircase.', 'The resident can only speak in stage directions until the curtain opens.', 'Receipts here are legal tender for impossible exits.']
const omens = ['a pencil door slowly becomes confident', 'the audience coughs in perfect JSON', 'a tiny train arrives behind the wallpaper', 'the moon dials itself to backstage', 'a staircase unfolds from a bookmark and bows']
const secrets = ['A second theater is printed on the back of the first.', 'The props rearrange into a handoff note for an autonomous agent.', 'There is a debugging window under the carpet.', 'The resident has already exported this room once.', 'A Discord bot could live comfortably in the orchestra pit.']

export const defaultInteractions: InteractionState = { curtainOpen: false, tabPull: 35, wallOpen: false, moonDial: 90, floorSlide: 28, backstage: false }

export function normalizeSeed(raw: string): string {
  const cleaned = raw.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 96)
  return cleaned || 'ryo opens a paper door for a tiny autonomous stagehand'
}

export function hashSeed(seed: string): number {
  let h = 2166136261
  for (const ch of seed) {
    h ^= ch.codePointAt(0) ?? 0
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function makeRng(seed: string) {
  let x = hashSeed(seed) || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) / 4294967296)
  }
}

function pick<T>(rng: () => number, list: readonly T[]): T { return list[Math.floor(rng() * list.length)] }
function pickMany(rng: () => number, list: readonly string[], count: number): string[] {
  const bag = [...list]
  return Array.from({ length: count }, () => bag.splice(Math.floor(rng() * bag.length), 1)[0])
}

export function generateTheater(rawSeed: string): GeneratedTheater {
  const seed = normalizeSeed(rawSeed)
  const rng = makeRng(seed)
  const palette = pick(rng, palettes)
  const residentTuple = pick(rng, residents)
  const adj = pick(rng, adjectives)
  const noun = seed.length > 18 && rng() > 0.42 ? seed.split(' ').slice(0, 3).join(' ') : pick(rng, nouns)
  const rarity = rng() > 0.91 ? 'rare' : rng() > 0.66 ? 'odd' : 'common'
  return {
    seed,
    seedHash: hashSeed(seed).toString(16).padStart(8, '0'),
    title: `The ${adj[0].toUpperCase()}${adj.slice(1)} ${noun.replace(/^./, c => c.toUpperCase())}`,
    palette,
    wallpaper: pick(rng, ['chevrons that disagree', 'constellated ledger lines', 'tiny window repeats', 'moth-wing marbling', 'topographic lace', 'receipt snow']),
    resident: { name: residentTuple[0], role: residentTuple[1], request: residentTuple[2] },
    props: pickMany(rng, props, 4),
    impossibleRule: pick(rng, rules),
    exitOmen: pick(rng, omens),
    secret: pick(rng, secrets),
    stageDirection: `When the tab reaches ${Math.floor(20 + rng() * 70)}%, the room admits it has been watching the operator.`,
    rarity,
  }
}

export function clampInteractions(input: Partial<InteractionState> = {}): InteractionState {
  return {
    curtainOpen: Boolean(input.curtainOpen ?? defaultInteractions.curtainOpen),
    wallOpen: Boolean(input.wallOpen ?? defaultInteractions.wallOpen),
    backstage: Boolean(input.backstage ?? defaultInteractions.backstage),
    tabPull: clampNum(input.tabPull, 0, 100, defaultInteractions.tabPull),
    moonDial: clampNum(input.moonDial, 0, 360, defaultInteractions.moonDial),
    floorSlide: clampNum(input.floorSlide, 0, 100, defaultInteractions.floorSlide),
  }
}

function clampNum(v: unknown, min: number, max: number, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback
}

export function encodeState(seed: string, interactions: Partial<InteractionState>): string {
  const data = { s: normalizeSeed(seed), i: clampInteractions(interactions) }
  return btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/=+$/, '')
}

export function decodeState(encoded: string | null): { seed: string; interactions: InteractionState } | null {
  if (!encoded || encoded.length > 1500) return null
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    const parsed = JSON.parse(json) as { s?: unknown; i?: Partial<InteractionState> }
    return { seed: normalizeSeed(String(parsed.s ?? '')), interactions: clampInteractions(parsed.i) }
  } catch {
    return null
  }
}

export function exportScenario(seed: string, interactions: Partial<InteractionState>) {
  const generated = generateTheater(seed)
  return { generated, interactions: clampInteractions(interactions), urlState: encodeState(seed, interactions) }
}
