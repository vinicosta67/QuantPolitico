"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Line, LineChart, ComposedChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { sentimentProjectionData, narrativeClusterData, trendDetectionData, stakeholderMappingData } from "@/lib/data";
import { themesOverview, themesDistribution, themeNews } from "@/lib/themes-mock";
import { getThemeInsights, type ThemeInsights, type ThemeFilters } from "./api";

export default function TemasPage() {
  const [days] = React.useState(7);
  const [selectedTheme, setSelectedTheme] = React.useState('economia');
  // Novos filtros (preparados p/ API)
  const [filters, setFilters] = React.useState<ThemeFilters>({ tema: 'economia', periodo: 30, fonte: 'newsdata' });
  const [insights, setInsights] = React.useState<ThemeInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = React.useState(true);
  const [errorInsights, setErrorInsights] = React.useState<string | null>(null);
  const overview = React.useMemo(()=> themesOverview(days), [days]);
  const distribution = React.useMemo(()=> themesDistribution(days), [days]);
  const news = React.useMemo(()=> themeNews(selectedTheme, 10), [selectedTheme]);

  // Carrega dados (mock/API) ao mudar filtros
  React.useEffect(() => {
    let alive = true;
    async function run() {
      setLoadingInsights(true);
      setErrorInsights(null);
      try {
        const data = await getThemeInsights(filters);
        if (!alive) return;
        setInsights(data);
      } catch (e: any) {
        if (!alive) return;
        setErrorInsights(e?.message || 'Falha ao carregar dados de temas');
        setInsights(null);
      } finally {
        if (alive) setLoadingInsights(false);
      }
    }
    run();
    return () => { alive = false };
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Seção de filtros e gráficos (mock preparados para API) */}
      <Card>
        <CardHeader>
          <CardTitle>Temas</CardTitle>
          <CardDescription>Selecione filtros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros: Tema, Perído, Fonte */}
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tema">Tema</Label>
              <Select value={filters.tema} onValueChange={(v)=>{ setFilters(f=>({ ...f, tema: v as any })); setSelectedTheme(v); }}>
                <SelectTrigger id="tema" className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="economia">Economia</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="seguranca">Segurança</SelectItem>
                  <SelectItem value="meio_ambiente">Meio Ambiente</SelectItem>
                  <SelectItem value="corrupcao">Corrupção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periodo">Perído</Label>
              <Select value={String(filters.periodo)} onValueChange={(v)=> setFilters(f=>({ ...f, periodo: parseInt(v,10) as any }))}>
                <SelectTrigger id="periodo" className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fonte">Fonte</Label>
              <Select value={filters.fonte} onValueChange={(v)=> setFilters(f=>({ ...f, fonte: v as any }))}>
                <SelectTrigger id="fonte" className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                  <SelectItem value="newsdata">Newsdata</SelectItem>
                  <SelectItem value="jornais">Jornais</SelectItem>
                  <SelectItem value="redes">Redes Sociais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gráfico 1: Polaridade X Volume */}
          <Card>
            <CardHeader><CardTitle>Polaridade X Volume (últimos {filters.periodo} dias)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ volume: { label: 'Volume', color: 'hsl(var(--primary))' }, polarity: { label: 'Polaridade média', color: '#f59e0b' } }} className="h-[300px] w-full">
                <ComposedChart data={insights?.polVol || []} margin={{ left: 8, right: 12, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} width={32} />
                  <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar yAxisId="left" dataKey="volume" fill={`var(--color-volume)`} radius={4} />
                  <Line yAxisId="right" type="monotone" dataKey="polarity" stroke={`var(--color-polarity)`} dot={false} strokeWidth={2.25} />
                  <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                </ComposedChart>
              </ChartContainer>
              {loadingInsights && <div className="mt-2 text-xs text-muted-foreground">Carregandoâ€¦</div>}
              {errorInsights && <div className="mt-2 text-xs text-destructive">{errorInsights}</div>}
            </CardContent>
          </Card>

          {/* Gráfico 2: Emoções X Tempo + Polaridade */}
          <Card>
            <CardHeader><CardTitle>Polaridade X Emoções (últimos {filters.periodo} dias)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  alegria: { label: 'Alegria', color: 'hsl(var(--chart-2))' },
                  tristeza: { label: 'Tristeza', color: '#6b7280' },
                  raiva: { label: 'Raiva', color: 'hsl(var(--destructive))' },
                  medo: { label: 'Medo', color: '#6366f1' },
                  surpresa: { label: 'Surpresa', color: 'hsl(var(--chart-4))' },
                  nojo: { label: 'Nojo', color: '#84cc16' },
                  polarity: { label: 'Polaridade', color: '#f59e0b' },
                }}
                className="h-[320px] w-full"
              >
                <ComposedChart data={insights?.emotions || []} margin={{ left: 8, right: 12, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" domain={[0, 1]} tickLine={false} axisLine={false} width={28} />
                  <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line yAxisId="left" type="monotone" dataKey="alegria" stroke={`var(--color-alegria)`} dot={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="tristeza" stroke={`var(--color-tristeza)`} dot={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="raiva" stroke={`var(--color-raiva)`} dot={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="medo" stroke={`var(--color-medo)`} dot={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="surpresa" stroke={`var(--color-surpresa)`} dot={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="nojo" stroke={`var(--color-nojo)`} dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="polarity" stroke={`var(--color-polarity)`} dot={false} strokeWidth={2.25} strokeDasharray="5 4" />
                  <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                </ComposedChart>
              </ChartContainer>
              {loadingInsights && <div className="mt-2 text-xs text-muted-foreground">Carregandoâ€¦</div>}
              {errorInsights && <div className="mt-2 text-xs text-destructive">{errorInsights}</div>}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold">Radar de Temas</h2>
        <p className="text-muted-foreground">Análise temática e tendências dos últimos {days} dias</p>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sentimento</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.sentiment_label}</div><div className="mt-1 text-xs text-muted-foreground">{(overview.sentiment_avg*100).toFixed(1)}% â€¢ 7d</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Volume Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.total_articles}</div><div className="mt-1 text-xs text-muted-foreground">Menções</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tendência</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2">{overview.trend_direction==='up'?<TrendingUp className="h-5 w-5 text-green-500"/>:overview.trend_direction==='down'?<TrendingDown className="h-5 w-5 text-red-500"/>:<Minus className="h-5 w-5"/>}{overview.trend_direction==='up'?'Subindo':overview.trend_direction==='down'?'Caindo':'Estável'}</div><div className="mt-1 text-xs text-muted-foreground">{overview.trend_percentage>0?'+':''}{overview.trend_percentage}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Última atualização</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.last_updated.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div><div className="mt-1 text-xs text-muted-foreground">{overview.last_updated.getFullYear()}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Distribuição */}
        <Card>
          <CardHeader><CardTitle>Distribuição de Temas (7 dias)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[260px] w-full">
              <BarChart data={distribution}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="theme_name" tickLine={false} axisLine={false} tickMargin={8}/>
                <YAxis />
                <RTooltip />
                <Bar dataKey="volume" radius={4} fill="hsl(var(--primary))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Análise de sentimento (sem projeção) */}
        <Card>
          <CardHeader><CardTitle>Análise de Sentimento</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ positive:{label:'Positivo',color:'hsl(var(--chart-2))'}, negative:{label:'Negativo', color:'hsl(var(--destructive))'} }} className="h-[250px] w-full">
              <LineChart data={sentimentProjectionData} margin={{ left: -20, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line"/>} />
                <Line dataKey="positive" type="monotone" stroke="var(--color-positive)" strokeWidth={2.5} dot={false} />
                <Line dataKey="negative" type="monotone" stroke="var(--color-negative)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Clusters */}
        <Card>
          <CardHeader><CardTitle>Clusters de Narrativa</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {narrativeClusterData.map((item)=> (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm"><span className="font-medium">{item.name}</span><span className="text-muted-foreground">{item.value}</span></div>
                <Progress value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Menções por tema (substitui "detecção de tendência") */}
        <Card>
          <CardHeader><CardTitle>Menções de Temas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trendDetectionData.map((item)=> (
              <div key={item.name} className="flex items-center gap-4">
                <p className="w-1/3 font-medium">{item.name}</p>
                <Progress value={item.value} indicatorStyle={{ background: item.color }} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feed de notí­cias por tema */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notí­cias classificadas: {selectedTheme}</CardTitle>
            <CardDescription>Selecione um tema para ver as notícias recentes (mock).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {['economia','saude','educacao','seguranca','meio_ambiente','corrupcao'].map((t)=> (
                <Badge key={t} variant={selectedTheme===t? 'default':'outline'} className="cursor-pointer" onClick={()=> setSelectedTheme(t)}>{t.replace('_',' ')}</Badge>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Notícia</TableHead><TableHead>Fonte</TableHead><TableHead>Data</TableHead><TableHead>Sentimento</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {news.map((n,i)=> (
                  <TableRow key={n.id||i}>
                    <TableCell className="font-medium"><a href={n.url} target="_blank" rel="noreferrer" className="hover:underline">{n.title}</a><div className="text-xs text-muted-foreground">{n.summary}</div></TableCell>
                    <TableCell>{n.source}</TableCell>
                    <TableCell className="text-xs">{new Date(n.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell><Badge variant={n.sentiment==='positive'? 'default': n.sentiment==='negative'? 'destructive':'secondary'}>{n.sentiment}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mapeamento de Stakeholders simples */}
        <Card>
          <CardHeader><CardTitle>Mapeamento de Stakeholders</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stakeholderMappingData.map((s)=> (
              <div key={s.name} className="flex items-center justify-between">
                <p className="font-medium">{s.name}</p>
                <div className="flex items-center gap-2 text-muted-foreground"><span>{s.position}</span>{s.trend==='up'?<TrendingUp className="h-4 w-4 text-green-500"/>:s.trend==='down'?<TrendingDown className="h-4 w-4 text-red-500"/>:<Minus className="h-4 w-4"/>}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

