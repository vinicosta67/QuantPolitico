"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/lib/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import type { DashboardData } from "./actions";
import { fetchDashboardData } from "./actions";

type ExtendedNews = (NewsArticle & { publishedAtLabel: string; sentimentValue?: number }) & {
  sentiment_score: number;
  sentimentRaw?: number;
  confidence_score?: number;
  category?: "economia" | "saude" | "educacao" | "seguranca";
  politicians_mentioned?: string[];
  emotion_primary?: "alegria" | "raiva" | "tristeza" | "neutro";
  content?: string;
};

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [allNews, setAllNews] = React.useState<ExtendedNews[]>([]);
  

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetchDashboardData();
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cores em escala 0..1
  const color01 = (v: number) => (v >= 0.75 ? 'text-green-600' : v >= 0.5 ? 'text-yellow-600' : 'text-red-600');
  const sentimentColor = (score: number) => color01(score);
  const confidenceColor = (v: number) => color01(v);
  const ratioColor = (v: number) => color01(v);
  const positivePctColor = (pct: number) => (pct >= 66 ? 'text-green-600' : pct <= 44 ? 'text-red-600' : 'text-yellow-600');

  const avg = (arr: number[]) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  const iapAvgVal = data ? avg(data.indicators.map((i) => i.iap)) : 0;
  const ibsAvgVal = data ? avg(data.indicators.map((i) => i.ibs)) : 0;
  const iapAvg = iapAvgVal.toFixed(3);
  const ibsAvg = ibsAvgVal.toFixed(3);

  // Metrics (derivados)
  // const metrics = React.useMemo(() => {
  //   const total = allNews.length || 1;
  //   const avg = allNews.reduce((s, n) => s + (n.sentiment_score || 0), 0) / total;
  //   const positive = allNews.filter(n => n.sentiment_score > 0.1).length / (allNews.length || 1) * 100;
  //   const conf = allNews.reduce((s, n) => s + (n.confidence_score || 0.8), 0) / total;
  //   return { total: allNews.length, sentimentAvg: avg, positivePercentage: positive, confidenceAvg: conf };
  // }, [allNews]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Visão Geral</h2>
        <p className="text-muted-foreground">Visão geral do sistema de inteligência política</p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total de Notícias</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{data?.overview.totalNews ?? '-'}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sentimento Médio</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${data ? sentimentColor(data.overview.sentimentAvg) : ''}`}>{data ? data.overview.sentimentAvg.toFixed(2) : '-'}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">% Positivas</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${data ? positivePctColor(data.overview.positivePct) : ''}`}>{data ? data.overview.positivePct.toFixed(1) + '%' : '-'}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Confiança Média</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${data ? confidenceColor(data.overview.confidenceAvg) : ''}`}>{data ? data.overview.confidenceAvg.toFixed(2) : '-'}</CardContent></Card>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader><CardTitle>Tags Automáticas</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(data?.tags ?? []).map((t) => (
            <Badge key={t.name} variant="outline">{t.name} <span className="ml-1 text-muted-foreground">{t.count}</span></Badge>
          ))}
        </CardContent>
      </Card>

      {/* Indicadores auxiliares (sem "Potencial médio", considerado não viável) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pico Estimado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">20h</div><div className="text-xs text-muted-foreground">Tempo para pico</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Decaimento</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">42h</div><div className="text-xs text-muted-foreground">Tempo de declínio</div></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Curva de Polaridade</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: 'Sentimento', color: 'hsl(var(--primary))' } }} className="h-[260px] w-full">
              <LineChart data={data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis domain={[0.4, 0.85]} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Volume de Notícias (semana)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: 'Volume', color: 'hsl(var(--chart-2))' } }} className="h-[260px] w-full">
              <BarChart data={data?.volume ?? []}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={4} fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores consolidados */}
      {/* <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>IAp Médio</CardTitle></CardHeader>
          <CardContent><div className={`text-3xl font-bold ${ratioColor(iapAvgVal)}`}>{iapAvg}</div><CardDescription>Índice de Aprovação</CardDescription></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>IBS Médio</CardTitle></CardHeader>
          <CardContent><div className={`text-3xl font-bold ${ratioColor(ibsAvgVal)}`}>{ibsAvg}</div><CardDescription>Bem-estar Social</CardDescription></CardContent>
        </Card>
      </div> */}

      {/* Rodapé */}
      <div className="text-center text-muted-foreground"><small>Última atualização: {data?.overview.updatedAtLabel ?? '-'}</small></div>
    </div>
  );
}
