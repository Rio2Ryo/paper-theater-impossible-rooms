import { useEffect, useMemo, useReducer, useState } from 'react'
import './App.css'
import { clampInteractions, decodeState, defaultInteractions, encodeState, exportScenario, generateTheater, type InteractionState } from './theater'

type State = { seed: string; interactions: InteractionState; copied: string }
type Action =
  | { type: 'seed'; seed: string }
  | { type: 'patch'; patch: Partial<InteractionState> }
  | { type: 'reset' }
  | { type: 'copy'; message: string }

const initialSeed = 'Ryo’s laundry cathedral with sleepy elevators'

function getInitial(): State {
  const params = new URLSearchParams(window.location.search)
  const decoded = decodeState(params.get('scene'))
  return { seed: decoded?.seed ?? initialSeed, interactions: decoded?.interactions ?? defaultInteractions, copied: '' }
}

function reducer(state: State, action: Action): State {
  if (action.type === 'seed') return { ...state, seed: action.seed.slice(0, 120) }
  if (action.type === 'patch') return { ...state, interactions: clampInteractions({ ...state.interactions, ...action.patch }) }
  if (action.type === 'copy') return { ...state, copied: action.message }
  return { seed: initialSeed, interactions: defaultInteractions, copied: 'Reset to house seed.' }
}

declare global {
  interface Window {
    paperTheater?: {
      inspect: () => unknown
      generate: (seed: string) => unknown
      setSeed: (seed: string) => void
      setState: (patch: Partial<InteractionState>) => void
      exportScenario: () => unknown
    }
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitial)
  const [debugOpen, setDebugOpen] = useState(new URLSearchParams(window.location.search).get('debug') === '1')
  const theater = useMemo(() => generateTheater(state.seed), [state.seed])
  const urlState = useMemo(() => encodeState(state.seed, state.interactions), [state.seed, state.interactions])
  const shareUrl = `${window.location.origin}${window.location.pathname}?scene=${encodeURIComponent(urlState)}${debugOpen ? '&debug=1' : ''}`

  useEffect(() => {
    const next = `?scene=${encodeURIComponent(urlState)}${debugOpen ? '&debug=1' : ''}`
    window.history.replaceState(null, '', next)
  }, [urlState, debugOpen])

  useEffect(() => {
    window.paperTheater = {
      inspect: () => exportScenario(state.seed, state.interactions),
      generate: (seed: string) => generateTheater(seed),
      setSeed: (seed: string) => dispatch({ type: 'seed', seed }),
      setState: (patch: Partial<InteractionState>) => dispatch({ type: 'patch', patch }),
      exportScenario: () => exportScenario(state.seed, state.interactions),
    }
  }, [state])

  async function copyShare() {
    const text = `${theater.title}\n${theater.impossibleRule}\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(text)
      dispatch({ type: 'copy', message: 'Copied a shareable stage note.' })
    } catch {
      dispatch({ type: 'copy', message: 'Clipboard blocked; URL is visible in debug/export panel.' })
    }
  }

  const i = state.interactions
  return <main className="shell" style={{ ['--paper' as string]: theater.palette.paper, ['--ink' as string]: theater.palette.ink, ['--glow' as string]: theater.palette.glow, ['--shadow' as string]: theater.palette.shadow, ['--accent' as string]: theater.palette.accent }}>
    <section className="hero" aria-labelledby="app-title">
      <p className="eyebrow">autonomous paper-stage / deterministic debug toy / shareable impossible room</p>
      <h1 id="app-title">Paper Theater of Impossible Rooms</h1>
      <p className="lede">Type a strange mission. The theater folds it into a tactile room with a resident, props, an impossible rule, and an exportable state an AI can inspect.</p>
      <label className="seedBox">Seed phrase
        <textarea value={state.seed} onChange={e => dispatch({ type: 'seed', seed: e.target.value })} aria-label="Seed phrase for the impossible room" />
      </label>
      <div className="actions">
        <button onClick={() => dispatch({ type: 'patch', patch: { curtainOpen: !i.curtainOpen } })}>{i.curtainOpen ? 'Close velvet curtain' : 'Open velvet curtain'}</button>
        <button onClick={() => dispatch({ type: 'patch', patch: { wallOpen: !i.wallOpen } })}>{i.wallOpen ? 'Fold wall shut' : 'Open wall flap'}</button>
        <button onClick={() => dispatch({ type: 'patch', patch: { backstage: !i.backstage } })}>{i.backstage ? 'Hide backstage' : 'Reveal backstage'}</button>
        <button onClick={copyShare}>Copy stage note</button>
        <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      </div>
      {state.copied && <p className="status" role="status">{state.copied}</p>}
    </section>

    <section className="stageCard" aria-label={`Generated theater: ${theater.title}`}>
      <div className={`stage ${i.curtainOpen ? 'open' : ''} ${i.wallOpen ? 'wall-open' : ''} ${i.backstage ? 'backstage' : ''}`}>
        <div className="curtain left" aria-hidden="true" />
        <div className="curtain right" aria-hidden="true" />
        <div className="wallpaper" data-pattern={theater.wallpaper} aria-hidden="true" />
        <div className="moon" style={{ transform: `rotate(${i.moonDial}deg)` }} aria-hidden="true">☾</div>
        <div className="floor" style={{ transform: `translateX(${i.floorSlide - 50}px) skewX(${(i.floorSlide - 50) / 8}deg)` }} aria-hidden="true" />
        <div className="flap"><span>{i.wallOpen ? theater.secret : 'open me'}</span></div>
        <div className="pull" style={{ left: `${i.tabPull}%` }}><span>tab</span></div>
        <div className="resident" title={theater.resident.role}>✦<strong>{theater.resident.name}</strong></div>
        <ul className="props">{theater.props.map((p) => <li key={p}>{p}</li>)}</ul>
        <div className="backstageNote">{theater.stageDirection}</div>
      </div>
      <div className="sliders">
        <label>Pull stage string <input type="range" min="0" max="100" value={i.tabPull} onChange={e => dispatch({ type: 'patch', patch: { tabPull: Number(e.target.value) } })} /></label>
        <label>Moon dial <input type="range" min="0" max="360" value={i.moonDial} onChange={e => dispatch({ type: 'patch', patch: { moonDial: Number(e.target.value) } })} /></label>
        <label>Floor slide <input type="range" min="0" max="100" value={i.floorSlide} onChange={e => dispatch({ type: 'patch', patch: { floorSlide: Number(e.target.value) } })} /></label>
      </div>
    </section>

    <section className="inspector">
      <div>
        <p className="eyebrow">room #{theater.seedHash} / {theater.palette.name} / {theater.rarity}</p>
        <h2>{theater.title}</h2>
        <p><b>Resident:</b> {theater.resident.name}, {theater.resident.role}, asks you to “{theater.resident.request}.”</p>
        <p><b>Impossible rule:</b> {theater.impossibleRule}</p>
        <p><b>Exit omen:</b> {theater.exitOmen}.</p>
      </div>
      <button className="debugToggle" onClick={() => setDebugOpen(!debugOpen)}>{debugOpen ? 'Hide JSON/debug surface' : 'Open JSON/debug surface'}</button>
      {debugOpen && <pre className="debug">{JSON.stringify({ shareUrl, api: 'window.paperTheater.inspect() / generate(seed) / setSeed(seed) / setState(patch)', ...exportScenario(state.seed, state.interactions) }, null, 2)}</pre>}
    </section>
  </main>
}
