export type ThemeFilters = {
  tema: 'economia' | 'saude' | 'educacao' | 'seguranca' | 'meio_ambiente' | 'corrupcao'
  periodo: 7 | 30 | 90
  fonte: 'broadcast' | 'newsdata' | 'jornais' | 'redes'
}

export type PolVolPoint = { date: string; volume: number; polarity: number }
export type EmotionPoint = {
  date: string
  alegria: number
  tristeza: number
  raiva: number
  medo: number
  surpresa: number
  nojo: number
  polarity: number
}

export type ThemeInsights = {
  polVol: PolVolPoint[]
  emotions: EmotionPoint[]
}

// Mock generator with deterministic seed. Replace body with real fetch later.
export async function getThemeInsights(filters: ThemeFilters): Promise<ThemeInsights> {
  const { tema, periodo, fonte } = filters
  const rnd = seeded(`${tema}|${fonte}|${periodo}`)

  const days = lastNDays(periodo)
  const polVol: PolVolPoint[] = days.map((d, i) => {
    const base = 40 + Math.round(rnd() * 120)
    const wave = Math.sin((i / (periodo - 1)) * Math.PI * 2) * (10 + rnd() * 20)
    const volume = Math.max(5, Math.round(base + wave))
    const polarity = parseFloat(((rnd() - 0.5) * 1.6).toFixed(2))
    return { date: d.label, volume, polarity }
  })

  const emotions: EmotionPoint[] = days.map((d, i) => {
    const row: any = { date: d.label }
    const ems = ['alegria', 'tristeza', 'raiva', 'medo', 'surpresa', 'nojo'] as const
    ems.forEach((e, idx) => {
      const base = 0.25 + idx * 0.07
      const wave = Math.sin((i / (periodo - 1)) * Math.PI * (1 + idx * 0.2)) * 0.15
      const noise = (rnd() - 0.5) * 0.1
      const v = Math.max(0, Math.min(1, base + wave + noise))
      row[e] = parseFloat(v.toFixed(2))
    })
    row.polarity = parseFloat(((rnd() - 0.5) * 1.8).toFixed(2))
    return row as EmotionPoint
  })

  // Simula latência de rede
  await delay(200)
  return { polVol, emotions }
}

function delay(ms: number) { return new Promise((res) => setTimeout(res, ms)) }

function seeded(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function lastNDays(n: number) {
  const days: { label: string; date: Date }[] = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const di = new Date(d)
    di.setDate(d.getDate() - i)
    const label = di.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    days.push({ label, date: di })
  }
  return days
}

