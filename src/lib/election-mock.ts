export type ElectionFilters = {
  cargo: 'governador' | 'senador' | 'presidente'
  estado: 'sp' | 'rj' | 'mg' | 'ba'
  partido: 'partido_a' | 'partido_b' | 'partido_c'
}

export type ElectionSources = {
  midia: boolean
  redes: boolean
  legislativo: boolean
}

// Deterministic PRNG to keep results stable per filter combination
function seeded(seedStr: string) {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  }
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0
    return seed / 0xffffffff
  }
}

function range(rnd: () => number, min: number, max: number, decimals = 0) {
  const v = min + rnd() * (max - min)
  return parseFloat(v.toFixed(decimals))
}

export function buildElectionData(filters: ElectionFilters, fontes: ElectionSources) {
  const key = `${filters.cargo}|${filters.estado}|${filters.partido}`
  const rnd = seeded(key)

  // Base KPIs
  let iap = range(rnd, 35, 60)
  let iapP = range(rnd, 30, 55)
  let its = range(rnd, 0.45, 0.85, 2)

  // Adjust by cargo
  if (filters.cargo === 'governador') { iap += 2; iapP += 1 }
  if (filters.cargo === 'presidente') { iap += 3; its += 0.03 }

  // Adjust by estado
  const ufBoost = { sp: 2, rj: 1, mg: 1.5, ba: 0.5 } as const
  iap += ufBoost[filters.estado]
  iapP += ufBoost[filters.estado] / 2

  // Adjust by partido
  const partySign = filters.partido === 'partido_a' ? 1 : filters.partido === 'partido_b' ? -1 : 0.5
  iapP += 2 * partySign

  // Sources influence
  if (!fontes.redes) {
    its = Math.max(0.3, its - 0.08)
  }
  if (!fontes.midia) {
    iap = Math.max(25, iap - 2.5)
  }
  if (fontes.legislativo) {
    iap += 0.5
    iapP += 0.5
  }

  iap = Math.max(20, Math.min(80, iap))
  iapP = Math.max(20, Math.min(80, iapP))
  its = Math.max(0, Math.min(1, parseFloat(its.toFixed(2))))

  // Topics change subtly by filters
  const temasBase = ['Economia', 'Segurança', 'Saúde', 'Educação', 'Meio Ambiente']
  const mapaTemas = temasBase.map((tema, idx) => {
    let valor = range(rnd, 40, 95)
    if (filters.partido === 'partido_b' && tema === 'Economia') valor += 5
    if (filters.estado === 'sp' && tema === 'Segurança') valor += 6
    if (!fontes.midia && tema === 'Meio Ambiente') valor -= 7
    return { tema, valor: Math.max(20, Math.min(99, Math.round(valor))) }
  })

  // Social networks grid
  const redesTemas = ['Economia', 'Segurança', 'Saúde', 'Educação']
  const redesSociais = redesTemas.map((tema) => {
    const base = range(rnd, 1, 5)
    const tw = base + (tema === 'Segurança' && filters.estado === 'rj' ? 1.5 : 0)
    const fb = base + (tema === 'Economia' && filters.partido === 'partido_a' ? 1 : 0)
    const ig = base + (tema === 'Educação' && filters.cargo === 'presidente' ? 1 : 0)
    const mul = fontes.redes ? 1 : 0
    return {
      tema,
      twitter: Math.round(Math.max(0, Math.min(5, tw * mul))),
      facebook: Math.round(Math.max(0, Math.min(5, fb * mul))),
      instagram: Math.round(Math.max(0, Math.min(5, ig * mul))),
    }
  })

  // Stakeholders depend on legislative toggle and UF
  const stakeholders = [
    { nome: 'Maria Oliveira', cargo: 'Jornalista', papel: 'Influente', impacto: range(rnd, -0.4, 0.8, 2), proximoEvento: 'Entrevista' },
    { nome: 'Instituto Alfa', cargo: 'Pesquisa', papel: 'Apoiador', impacto: range(rnd, 0.1, 0.6, 2), proximoEvento: 'Divulgação' },
  ] as any[]
  if (fontes.legislativo) {
    stakeholders.push({ nome: 'Líder do Senado', cargo: filters.estado.toUpperCase(), papel: 'Neutro', impacto: range(rnd, -0.2, 0.2, 2), proximoEvento: 'Sessão' })
  }

  return {
    kpis: { iap: Math.round(iap), iapP: Math.round(iapP), its },
    mapaTemas,
    redesSociais,
    stakeholders,
  }
}

