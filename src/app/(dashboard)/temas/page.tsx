"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Line, LineChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { themesRadarData, sentimentProjectionData, narrativeClusterData, trendDetectionData, stakeholderMappingData } from "@/lib/data";
import { themesOverview, themesDistribution, themeNews } from "@/lib/themes-mock";

const WavyLine = ({ color = 'hsl(var(--primary))' }) => (
  <svg width="40" height="10" viewBox="0 0 40 10" className="opacity-70"><path d="M0 5 Q 5 0, 10 5 T 20 5 T 30 5 T 40 5" stroke={color} fill="none" strokeWidth="2"/></svg>
);

export default function TemasPage() {
  const [days] = React.useState(7);
  const [selectedTheme, setSelectedTheme] = React.useState('economia');
  const overview = React.useMemo(()=> themesOverview(days), [days]);
  const distribution = React.useMemo(()=> themesDistribution(days), [days]);
  const news = React.useMemo(()=> themeNews(selectedTheme, 10), [selectedTheme]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">📡 Radar de Temas</h2>
        <p className="text-muted-foreground">Análise temática e tendências dos últimos {days} dias</p>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sentimento</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.sentiment_label}</div><div className="mt-1 text-xs text-muted-foreground">{(overview.sentiment_avg*100).toFixed(1)}% • 7d</div></CardContent></Card>
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

        {/* Sentimento e projeção */}
        <Card>
          <CardHeader><CardTitle>Análise de Sentimento e Projeção</CardTitle></CardHeader>
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

        {/* Detecção de tendência (fix: cores corretas) */}
        <Card>
          <CardHeader><CardTitle>Detecção de Tendência</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trendDetectionData.map((item)=> (
              <div key={item.name} className="flex items-center gap-4">
                <p className="w-1/3 font-medium">{item.name}</p>
                <Progress value={item.value} indicatorStyle={{ background: item.color }} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feeder de notícias por tema */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Artigos sobre: {selectedTheme}</CardTitle>
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

