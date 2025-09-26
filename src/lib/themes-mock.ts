export type ThemeDistributionItem = { theme_name: string; volume: number; sentiment_score: number }
export type ThemeArticle = { id: string; title: string; summary: string; source: string; url: string; created_at: string; sentiment: 'positive'|'neutral'|'negative' }

function seeded(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 0xffffffff);
}

function range(rnd: () => number, min: number, max: number, decimals = 2) {
  return parseFloat((min + rnd() * (max - min)).toFixed(decimals));
}

export function themesOverview(days: number) {
  const rnd = seeded(`overview|${days}`)
  const sentiment_avg = range(rnd, -0.2, 0.4)
  const sentiment_label = sentiment_avg > 0.1 ? 'Positivo' : sentiment_avg < -0.1 ? 'Negativo' : 'Neutro'
  const total_articles = Math.floor(800 + rnd()*600)
  const trend_percentage = Math.floor(-10 + rnd()*25)
  const trend_direction = trend_percentage > 2 ? 'up' : trend_percentage < -2 ? 'down' : 'flat'
  // Data fixa para evitar divergência SSR/CSR
  const last_updated = new Date('2024-06-01T12:00:00Z')
  return { sentiment_avg, sentiment_label, total_articles, trend_percentage, trend_direction, last_updated }
}

export function themesDistribution(days: number): ThemeDistributionItem[] {
  const themes = ['economia','saude','educacao','seguranca','meio_ambiente','corrupcao']
  const rnd = seeded(`distribution|${days}`)
  return themes.map((t, i)=> ({
    theme_name: t,
    volume: Math.floor(50 + rnd()*200 + i*10),
    sentiment_score: range(rnd, -0.3, 0.5)
  }))
}

export function themeNews(theme: string, limit = 10): ThemeArticle[] {
  const sources = ['G1','UOL','Folha','Estadão','CNN Brasil']
  const sentiments: ThemeArticle['sentiment'][] = ['positive','neutral','negative']
  const baseDate = Date.parse('2024-06-01T12:00:00Z')
  return Array.from({length: limit}).map((_,i)=> ({
    id: `${theme}-${i}`,
    title: `${theme.replace('_',' ')}: atualização ${i+1}`,
    summary: `Resumo simulado sobre ${theme.replace('_',' ')} com destaques e contexto.`,
    source: sources[i % sources.length],
    url: '#',
    created_at: new Date(baseDate - i*3600*1000).toISOString(),
    sentiment: sentiments[i % sentiments.length],
  }))
}
