import { exportScenario, generateTheater, type InteractionState } from '../src/theater'

const args = process.argv.slice(2)
function valueOf(flag: string, fallback = '') {
  const idx = args.indexOf(flag)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  return fallback
}
const seed = valueOf('--seed', args.find(a => !a.startsWith('--')) ?? 'ryo dogfoods a paper theater')
const format = valueOf('--format', 'text')
const interactions: InteractionState = {
  curtainOpen: args.includes('--open'),
  wallOpen: args.includes('--wall'),
  backstage: args.includes('--backstage'),
  tabPull: Number(valueOf('--tab', '64')),
  moonDial: Number(valueOf('--moon', '135')),
  floorSlide: Number(valueOf('--floor', '48')),
}
const scenario = exportScenario(seed, interactions)

if (format === 'json') {
  console.log(JSON.stringify(scenario, null, 2))
} else if (format === 'url') {
  console.log(`/?scene=${encodeURIComponent(scenario.urlState)}&debug=1`)
} else {
  const t = generateTheater(seed)
  console.log(`Paper Theater Scenario\nseed: ${t.seed}\nroom: ${t.title}\nresident: ${t.resident.name}, ${t.resident.role}\nrule: ${t.impossibleRule}\nprops: ${t.props.join(' / ')}\nsecret: ${t.secret}\nurl: /?scene=${encodeURIComponent(scenario.urlState)}&debug=1`)
}
