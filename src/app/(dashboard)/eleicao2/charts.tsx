'use client';

import * as React from 'react';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// --- Componente para os KPIs (IAp e IApP) ---
export function KpiCard({ title, subtitle, value }: { title: string, subtitle: string, value: number }) {
  // Dados falsos para o minigráfico (sparkline)
  const chartData = [
    { v: Math.random() * 10 }, { v: Math.random() * 10 + 10 },
    { v: Math.random() * 10 + 5 }, { v: Math.random() * 10 + 20 },
    { v: Math.random() * 10 + 15 }, { v: Math.random() * 10 + 30 },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <div className="text-5xl font-light mb-2">{value}%</div>
        <div className="h-12 -mx-6 -mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="kpiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#kpiGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Gráfico de Medidor (Gauge) para o ITS ---
export function GaugeChart({ value, change }: { value: number, change: number }) {
  // O ângulo da seta, de -90 (esquerda) a +90 (direita)
  const angle = value * 180 - 90;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Transferibilidade de votos</CardTitle>
        <p className="text-xs text-muted-foreground">(Transferibilidade de Votos)</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="text-5xl font-light">{value.toFixed(2).replace('.', ',')}</div>
        <div className="flex items-center text-red-500 font-semibold text-sm">
          <ArrowUp className="h-4 w-4 mr-1" /> {change.toFixed(2).replace('.', ',')}
        </div>
        <div className="relative w-48 h-24 mt-2 overflow-hidden">
          {/* Fundo cinza do medidor */}
          <div className="absolute top-0 left-0 w-full h-full border-[12px] border-gray-200 rounded-t-full border-b-0"></div>
          {/* Progresso vermelho do medidor */}
          <div
            className="absolute top-0 left-0 w-full h-full border-[12px] border-red-500 rounded-t-full border-b-0 transition-transform duration-500"
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              transform: `rotate(${value * 180}deg)`,
              transformOrigin: 'bottom center',
            }}
          ></div>
          {/* Seta */}
          <div
            className="absolute bottom-0 left-1/2 w-1 h-16 bg-gray-700 origin-bottom transition-transform duration-500 -ml-0.5"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Gráfico de Radar para Mapa de Temas ---
export function RadarChartComponent({ data }: { data: { tema: string, valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="tema" tick={{ fontSize: 12 }} />
        <Radar dataKey="valor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// --- Gráfico de Linhas: Comparação de Aprovação ---
type ApprovalHistoryComparisonProps = {
  cargo?: 'governador' | 'senador' | 'presidente'
  estado?: 'sp' | 'rj' | 'mg' | 'ba'
}

// Deterministic PRNG igual ao usado em lib/election-mock.ts
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function monthLabels(count = 18) {
  const labels: string[] = []
  const today = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }))
  }
  return labels
}

function availablePoliticiansFor(estado?: string, cargo?: string) {
  if (cargo === 'presidente') {
    // Lista de presidenciáveis conhecidos (rótulos para comparação fictícia)
    const presidents = [
      'Lula',
      'Jair Bolsonaro',
      'Ciro Gomes',
      'Simone Tebet',
      'Marina Silva',
      'Sergio Moro',
      'Guilherme Boulos',
      'João Amoêdo',
    ]
    const rnd = seeded(`${estado}|${cargo}|names`)
    return [...presidents].sort(() => (rnd() - 0.5))
  }

  const base = [
    'Ana Silva',
    'Bruno Costa',
    'Carla Mendes',
    'Diego Rocha',
    'Eduarda Lima',
    'Felipe Santos',
    'Gabriela Nunes',
    'Henrique Alves',
    'Isabela Duarte',
    'João Pereira',
  ]
  const rnd = seeded(`${estado}|${cargo}|names`)
  return [...base].sort(() => (rnd() - 0.5))
}

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function buildSeries(names: string[], seedKey: string, labels: string[]) {
  const rngs = names.map((n) => ({ key: slug(n), label: n, rnd: seeded(`${seedKey}|${n}`), drift: (seeded(`${seedKey}|${n}|d`)() - 0.5) * 0.5 }))
  const base = labels.map((_, i) => ({ idx: i, month: labels[i] }))
  const data = base.map((b) => {
    const row: Record<string, number | string> = { month: b.month }
    rngs.forEach(({ key, rnd, drift }, k) => {
      const phase = (k + 1) * 0.6
      const wave = Math.sin((b.idx / (labels.length - 1)) * Math.PI * (1.2 + phase))
      const noise = (rnd() - 0.5) * 6
      const trend = (b.idx / (labels.length - 1)) * drift * 30
      const value = clamp(50 + wave * 15 + trend + noise, 20, 85)
      row[key] = Math.round(value)
    })
    return row
  })
  return data
}

export function ApprovalHistoryComparison({ cargo, estado }: ApprovalHistoryComparisonProps) {
  const [search, setSearch] = React.useState('')
  const allNames = React.useMemo(() => availablePoliticiansFor(estado, cargo), [estado, cargo])
  const [selected, setSelected] = React.useState<string[]>(() => {
    if (cargo === 'presidente') {
      const preferred = ['Lula', 'Jair Bolsonaro'].filter((n) => allNames.includes(n))
      if (preferred.length) return preferred
    }
    return allNames.slice(0, 2)
  })
  const filtered = React.useMemo(() => allNames.filter((n) => n.toLowerCase().includes(search.toLowerCase())), [allNames, search])
  React.useEffect(() => {
    const allSet = new Set(allNames)
    const currentValid = selected.filter((n) => allSet.has(n))
    if (cargo === 'presidente') {
      const pref = ['Lula', 'Jair Bolsonaro'].filter((n) => allSet.has(n))
      // Ajusta se mudou de cargo ou se seleção ficou inválida
      if (pref.length && (currentValid.length !== selected.length || !selected.length || selected[0] !== pref[0])) {
        setSelected(pref)
        return
      }
    }
    if (!selected.length || currentValid.length !== selected.length) {
      setSelected(allNames.slice(0, 2))
    }
  }, [cargo, allNames])

  const labels = React.useMemo(() => monthLabels(18), [])
  const chartData = React.useMemo(() => buildSeries(selected, `${estado}|${cargo}|series`, labels), [selected, estado, cargo, labels])

  const palette = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']
  const config = React.useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {}
    selected.forEach((name, i) => {
      cfg[slug(name)] = { label: name, color: palette[i % palette.length] }
    })
    return cfg
  }, [selected])

  const toggle = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name)
      if (prev.length >= palette.length) return prev
      return [...prev, name]
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Comparação do IAp por Político</CardTitle>
          <p className="text-xs text-muted-foreground">Histórico mensal do índice de aprovação</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="gap-2">
              Selecionar políticos
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs">{selected.length}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="space-y-3">
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="max-h-56 space-y-2 overflow-auto pr-1">
                {filtered.map((name) => (
                  <label key={name} className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={selected.includes(name)} onCheckedChange={() => toggle(name)} id={`p-${name}`} />
                    <span className="text-sm">{name}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">Selecione até 5 políticos para comparar</div>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((n, i) => (
            <Badge key={n} variant="outline" className="cursor-default" style={{ borderColor: 'hsl(var(--border))' }}>
              <span className="mr-2 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: palette[i % palette.length] }} />
              {n}
            </Badge>
          ))}
        </div>

        <ChartContainer config={config} className="h-[300px] w-full">
          <LineChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis domain={[20, 85]} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {selected.map((name) => (
              <Line key={name} type="monotone" dataKey={slug(name)} stroke={`var(--color-${slug(name)})`} dot={false} strokeWidth={2.25} />
            ))}
            <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
