export type RecType = 'strategic' | 'media' | 'social'
export type Timeframe = 'day' | 'week' | 'month' | 'quarter'

export type Recommendation = {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  impact_score: number
  urgency: 'high' | 'medium' | 'low'
  category: 'messaging' | 'digital' | 'crisis' | 'media' | 'timing' | 'content' | 'monitoring'
  timeframe: string
  evidence?: string
  actions?: string[]
  created_date: string
}

export type QuickStats = {
  active: number
  implemented: number
  pending: number
  successRate: number // 0..100
}

function seeded(seedStr: string) {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 0xffffffff)
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

export function generateRecommendations(type: RecType, politician: string, timeframe: Timeframe): Recommendation[] {
  const rnd = seeded(`rec|${type}|${politician}|${timeframe}`)
  const base: Recommendation[] = []
  const priorities: Recommendation['priority'][] = ['high', 'medium', 'low']
  const urgencies: Recommendation['urgency'][] = ['high', 'medium', 'low']
  const categories: Recommendation['category'][] = ['messaging', 'digital', 'crisis', 'media', 'timing', 'content', 'monitoring']

  const count = type === 'strategic' ? 3 : type === 'media' ? 2 : 2
  for (let i = 0; i < count; i++) {
    const category = pick(categories, rnd)
    const pr = priorities[i % priorities.length]
    const urg = urgencies[(i + 1) % urgencies.length]
    const impact = parseFloat((6 + rnd() * 4).toFixed(1))
    const id = `${type}-${i}`
    base.push({
      id,
      title: buildTitle(type, category),
      description: buildDescription(type, politician),
      priority: pr,
      impact_score: impact,
      urgency: urg,
      category,
      timeframe: type === 'strategic' ? '2-4 semanas' : type === 'media' ? '3-6 semanas' : '1-3 semanas',
      evidence: buildEvidence(type),
      actions: buildActions(type),
      created_date: new Date('2024-06-01T12:00:00Z').toISOString(),
    })
  }
  return base
}

function buildTitle(type: RecType, category: Recommendation['category']) {
  if (type === 'strategic') return 'Ajustar Narrativa Estratégica'
  if (type === 'media') return 'Otimizar Presença em Mídia'
  if (category === 'content') return 'Amplificar Conteúdo Positivo'
  return 'Ajuste de Operação nas Redes'
}

function buildDescription(type: RecType, politician: string) {
  if (type === 'strategic') return `${politician} deve reforçar mensagens‑chave para consolidar percepção.`
  if (type === 'media') return `Expandir presença em veículos alternativos para atingir novos públicos.`
  return `Fortalecer engajamento e resposta a tendências emergentes.`
}

function buildEvidence(type: RecType) {
  if (type === 'strategic') return 'Variação de 15% no sentimento em temas econômicos (7d)'
  if (type === 'media') return '70% das menções concentradas em mídia tradicional'
  return 'Oportunidade de +40% de engajamento em conteúdo positivo'
}

function buildActions(type: RecType) {
  if (type === 'strategic') return ['Agenda de entrevistas', 'Release com indicadores', 'Briefing de narrativa']
  if (type === 'media') return ['Agenda em podcasts', 'Entrevistas no YouTube', 'Participações em programas jovens']
  return ['Conteúdo viral positivo', 'Alertas em tempo real', 'Templates de resposta']
}

export function getQuickStats(): QuickStats {
  return { active: 12, implemented: 8, pending: 4, successRate: 85 }
}

