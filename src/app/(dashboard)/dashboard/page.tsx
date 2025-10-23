"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/lib/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, ComposedChart } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateNewsReportAction, searchNews } from "../noticias/actions";
import type { DashboardData } from "./actions";
import { fetchDashboardData } from "./actions";
import { newsReportToPdfBytes } from "@/lib/news-report-pdf";
// (Server will generate the PDF for WhatsApp send)
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import { sendTextToWhatsApp } from "@/app/(dashboard)/noticias/whatsapp";
import { sendSixHourNewsPdfToWhatsAppStrong } from "@/app/(dashboard)/noticias/whatsapp-strong";

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
  const { toast } = useToast();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [allNews, setAllNews] = React.useState<ExtendedNews[]>([]);
  // Reports state (reuse from Notícias)
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportType, setReportType] = React.useState<'daily'|'weekly'|'custom'|null>(null);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportData, setReportData] = React.useState<any>(null);
  const [sendingReport, setSendingReport] = React.useState(false);
  const [sendingSixHourPdf, setSendingSixHourPdf] = React.useState(false);
  const [customForm, setCustomForm] = React.useState<{ query: string; days: number }>({ query: "", days: 7 });
  

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

  // Carrega notícias reais (reuso da aba Notícias)
  React.useEffect(() => {
    (async () => {
      try {
        const items = await searchNews("");
        const mapRaw = (raw?: number) => (raw === 1 ? -1 : raw === 3 ? 1 : 0);
        const enriched = items.map((n: any) => ({ ...n, sentiment_score: mapRaw((n as any)?.sentimentValue) }));
        setAllNews(enriched as any);
      } catch {
        setAllNews([]);
      }
    })();
  }, []);
  const newsKpis = React.useMemo(() => {
    const total = allNews.length;
    const sentimentAvg = total ? allNews.reduce((s: number, n: any) => s + (n.sentiment_score || 0), 0) / total : 0;
    const positivePct = total ? (allNews.filter((n: any) => (n.sentiment_score || 0) > 0).length / total) * 100 : 0;
    return { total, sentimentAvg, positivePct };
  }, [allNews]);

  // Build concise WhatsApp text from a generated report
  const buildWhatsAppReportMessage = React.useCallback((r: any) => {
    if (!r) return "";
    const topThemes = Array.isArray(r.keyMetrics?.topThemes) ? r.keyMetrics.topThemes.slice(0, 5) : [];
    const highlights = Array.isArray(r.highlights) ? r.highlights.slice(0, 5) : [];
    const risks = Array.isArray(r.risks) ? r.risks.slice(0, 3) : [];
    const recs = Array.isArray(r.recommendations) ? r.recommendations.slice(0, 3) : [];
    const lines: string[] = [];
    lines.push(`Relatório: ${r.title}`);
    if (r.timeframeLabel) lines.push(r.timeframeLabel);
    if (r.summary) lines.push("", r.summary);
    lines.push(
      "",
      `Métricas: total ${r.keyMetrics?.total ?? "-"}, polaridade média ${Number(r.keyMetrics?.avgSentiment ?? 0).toFixed(2)}, % positivas ${Number(r.keyMetrics?.positivePct ?? 0).toFixed(1)}%`
    );
    if (topThemes.length) lines.push(`Top temas: ${topThemes.map((t: string) => `#${t}`).join(' ')}`);
    if (highlights.length) {
      lines.push("", "Destaques:");
      highlights.forEach((h: string, i: number) => lines.push(`${i + 1}) ${h}`));
    }
    if (risks.length) {
      lines.push("", "Riscos:");
      risks.forEach((h: string, i: number) => lines.push(`${i + 1}) ${h}`));
    }
    if (recs.length) {
      lines.push("", "Ações:");
      recs.forEach((h: string, i: number) => lines.push(`${i + 1}) ${h}`));
    }
    const msg = lines.join("\n");
    return msg.length > 1500 ? msg.slice(0, 1495).trimEnd() + "…" : msg;
  }, []);

  const handleSendReportWhatsApp = React.useCallback(async () => {
    try {
      setSendingReport(true);
      const type = (reportType ?? 'weekly');
      const days = type === 'daily' ? 1 : type === 'weekly' ? 7 : 7;
      const data = await generateNewsReportAction({ type, query: '', days } as any);
      const text = buildWhatsAppReportMessage(data);
      if (!text) throw new Error('Não foi possível montar o relatório.');
      await sendTextToWhatsApp(text);
      toast({ title: 'Enviado', description: 'Relatório enviado para o WhatsApp configurado.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Falha no envio', description: e?.message || 'Verifique as credenciais e tente novamente.', variant: 'destructive' });
    } finally {
      setSendingReport(false);
    }
  }, [reportType, buildWhatsAppReportMessage, toast]);

  // Envia PDF de notícias das últimas 6 horas via WhatsApp
  const handleSendSixHourNewsPdfWhatsApp = React.useCallback(async () => {
    try {
      setSendingSixHourPdf(true)
      await sendSixHourNewsPdfToWhatsAppStrong()
      toast({ title: 'Enviado', description: 'PDF com notícias (6h) enviado ao WhatsApp configurado.' })
    } catch (e: any) {
      console.error(e)
      toast({ title: 'Falha no envio', description: e?.message || 'Verifique as credenciais e tente novamente.', variant: 'destructive' })
    } finally {
      setSendingSixHourPdf(false)
    }
  }, [toast])
  // Temas e fontes (mock - pronto para API)
  const availableThemes = React.useMemo(() => (
    ['economia','saude','educacao','seguranca','meio_ambiente','corrupcao']
  ), []);
  const sources = React.useMemo(() => (['broadcast','newsdata','redes'] as const), []);
  const [selectedThemes, setSelectedThemes] = React.useState<string[]>(['economia']);
  const [periodDays, setPeriodDays] = React.useState<7|30|90>(30);
  const seeded = React.useCallback((s: string) => {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }, []);
  const lastNDays = React.useCallback((n: number) => {
    const arr: { label: string; date: Date }[] = []; const d = new Date();
    for (let i = n - 1; i >= 0; i--) { const di = new Date(d); di.setDate(d.getDate() - i); arr.push({ label: di.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), date: di }); }
    return arr;
  }, []);

  const { chartData, configKeys } = React.useMemo(() => {
    const rnd = seeded(`${selectedThemes.join(',')}|${periodDays}`);
    const days = lastNDays(periodDays);
    const cfg: Record<string, { label: string; color: string }> = {};
    const sourceColors: Record<string,string> = { broadcast: 'hsl(var(--chart-1))', newsdata: 'hsl(var(--chart-3))', redes: 'hsl(var(--chart-5))' };
    const rows = days.map((d, idx) => {
      const row: any = { date: d.label };
      selectedThemes.forEach((t, ti) => {
        const base = 20 + rnd()*80 + ti*5;
        const wave = Math.sin((idx/(days.length-1))*Math.PI*2*(1+ti*0.2))*15;
        const vol = Math.max(2, Math.round(base + wave + (rnd()-0.5)*10));
        row[`vol_${t}`] = vol;
        sources.forEach((src, si) => {
          const w = Math.sin((idx/(days.length-1))*Math.PI*(1+si*0.25+ti*0.15));
          const noise = (rnd()-0.5)*0.2; const sent = Math.max(-1, Math.min(1, 0.1 + 0.4*w + noise));
          const key = `${t}_${src}`; row[key] = parseFloat(sent.toFixed(2));
          if (!cfg[key]) { const c = sourceColors[src] || 'hsl(var(--chart-2))'; cfg[key] = { label: `${t}/${src}`, color: c }; }
        });
      });
      return row;
    });
    cfg.volume = { label: 'Volume', color: 'hsl(var(--muted-foreground))' } as any;
    return { chartData: rows, configKeys: cfg };
  }, [selectedThemes, periodDays, sources, lastNDays, seeded]);

  const toggleTheme = (t: string) => setSelectedThemes((prev)=> prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);

  const openReport = React.useCallback(async (type: 'daily'|'weekly'|'custom', custom?: {query?: string; days?: number}) => {
    try {
      setReportLoading(true)
      const days = custom?.days ?? (type==='daily'?1:type==='weekly'?7:7)

      if (allNews && allNews.length) {
        const total = allNews.length
        const avgSent = total ? allNews.reduce((s, n: any) => s + (n.sentiment_score || 0), 0) / total : 0
        const posPct = total ? (allNews.filter((n: any) => (n.sentiment_score || 0) > 0).length / total) * 100 : 0

        const now = new Date()
        const start = new Date(now.getTime() - days*24*3600*1000)
        const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
        const timeframeLabel = `${fmt(start)} – ${fmt(now)}`

        const themeCount: Record<string, number> = {}
        allNews.forEach((n:any)=>{ const c = (n.category||'').toString(); if(c){ themeCount[c] = (themeCount[c]||0)+1 } })
        let topThemes = Object.entries(themeCount).sort((a,b)=> b[1]-a[1]).slice(0,5).map(([k])=>k)
        if (!topThemes.length) {
          const stop = new Set(['de','da','do','das','dos','a','o','e','é','em','para','com','no','na','os','as','uma','por','sobre','ao','à','que'])
          const bag: Record<string, number> = {}
          allNews.forEach((n:any)=>{
            const text = (n.title||'').toLowerCase()
            text.split(/[^a-zà-úÀ-Ú0-9_]+/i).forEach(w=>{ if(w && w.length>3 && !stop.has(w)) bag[w]=(bag[w]||0)+1 })
          })
          topThemes = Object.entries(bag).sort((a,b)=> b[1]-a[1]).slice(0,5).map(([k])=>k)
        }

        const highlights = [...allNews]
          .sort((a:any,b:any)=> new Date(b.publishedAt||b.publishedAtLabel||0).getTime() - new Date(a.publishedAt||a.publishedAtLabel||0).getTime())
          .slice(0,6)
          .map((n:any)=> `${n.title}`)

        const negatives = allNews.filter((n:any)=> (n.sentiment_score||0) < -0.05).length
        const positives = allNews.filter((n:any)=> (n.sentiment_score||0) > 0.05).length
        const risks: string[] = []
        if (negatives > positives) risks.push('Polaridade negativa predominante no período, atenção à resposta rápida.')
        if (posPct < 40) risks.push('Baixa proporção de notícias positivas.')
        risks.push('Monitorar picos temáticos e possíveis narrativas adversas.')

        const recommendations: string[] = []
        recommendations.push('Publicar síntese propositiva destacando dados verificáveis.')
        recommendations.push('Ativar rede aliada nas redes sociais para pautar mensagens‑chave.')
        recommendations.push('Preparar Q&A para imprensa com três mensagens centrais.')

        const report = {
          title: type==='daily' ? 'Relatório Diário de Notícias e Narrativas' : type==='weekly' ? 'Relatório Semanal de Notícias e Narrativas' : 'Relatório Personalizado de Notícias',
          timeframeLabel,
          summary: `Período de ${days} dia(s). Total: ${total}. Polaridade média: ${avgSent.toFixed(2)}. Positivas: ${posPct.toFixed(1)}%.`,
          keyMetrics: { total, avgSentiment: avgSent, positivePct: posPct, topThemes },
          highlights,
          risks,
          recommendations,
        } as any

        const pdfBytes = await newsReportToPdfBytes(report)
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const stamp = new Date().toISOString().slice(0,10)
        a.href = url
        a.download = `Relatorio_noticias_${type}_${stamp}.pdf`
        document.body.appendChild(a)
        a.click(); a.remove(); URL.revokeObjectURL(url)
        return
      }

      const input = { type, query: custom?.query ?? '', days } as any
      const data = await generateNewsReportAction(input)
      const pdfBytes = await newsReportToPdfBytes(data as any)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0,10)
      a.href = url
      a.download = `Relatorio_noticias_${type}_${stamp}.pdf`
      document.body.appendChild(a)
      a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Falha ao gerar PDF do relatório', e)
      alert('Não foi possível gerar o PDF agora.')
    } finally {
      setReportLoading(false)
    }
  }, [allNews])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Visão Geral</h2>
        <p className="text-muted-foreground">Visão geral do sistema de inteligência política</p>
      </div>

      {/* KPIs de Notícias (reutilizados da aba Notícias) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total de Notícias</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{newsKpis.total}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sentimento Médio</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${sentimentColor(newsKpis.sentimentAvg)}`}>{newsKpis.sentimentAvg.toFixed(2)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Notícias Positivas</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${positivePctColor(newsKpis.positivePct)}`}>{newsKpis.positivePct.toFixed(1)}%</CardContent></Card>
      </div>

      {/* Temas por Fonte (mock pronto p/ API) */}
      <Card>
        <CardHeader>
          <CardTitle>Temas por Fonte</CardTitle>
          <CardDescription>Selecione temas. Barras mostram volume; linhas mostram sentimento por fonte.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">Selecionar temas <span className="ml-2 text-xs text-muted-foreground">({selectedThemes.length})</span></Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <div className="space-y-2">
                  {availableThemes.map((t) => (
                    <label key={t} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedThemes.includes(t)} onCheckedChange={()=> toggleTheme(t)} />
                      <span className="capitalize">{t.replace('_',' ')}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <ChartContainer config={configKeys as any} className="h-[320px] w-full">
            <ComposedChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} width={28} />
              <YAxis yAxisId="right" orientation="right" domain={[-1,1]} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {selectedThemes.map((t) => (
                <Bar key={`vol_${t}`} yAxisId="left" dataKey={`vol_${t}`} stackId="vol" fill={`var(--color-volume)`} opacity={0.35} radius={3} />
              ))}
              {selectedThemes.flatMap((t) => sources.map((s) => ({ key: `${t}_${s}`, theme: t, src: s })) ).map(({key}) => (
                <Line key={key} yAxisId="right" type="monotone" dataKey={key} stroke={`var(--color-${key})`} dot={false} strokeWidth={2} />
              ))}
              <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Relatórios (reuso Notícias) */}
      <Card>
        <CardHeader><CardTitle>Relatórios de Notícias</CardTitle><CardDescription>Gere PDF com análises. Reutiliza lógica da aba Notícias.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={()=> openReport('daily')}>Relatório Diário</Button>
            <Button size="sm" variant="outline" onClick={()=> openReport('weekly')}>Relatório Semanal</Button>
            <Button size="sm" variant="secondary" onClick={()=> { setReportOpen(true); setReportType('custom'); setReportData(null); }}>Personalizado…</Button>
            <Button size="sm" variant="outline" onClick={handleSendReportWhatsApp} disabled={sendingReport}>
              {sendingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Enviar relatório via WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={handleSendSixHourNewsPdfWhatsApp} disabled={sendingSixHourPdf}>
              {sendingSixHourPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Enviar notícias 6 horas
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={(o)=>{ setReportOpen(o); if(!o){ setReportData(null); setReportLoading(false);} }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {reportType==='custom' ? 'Relatorio Personalizado' : reportType==='daily' ? 'Relatorio Diario' : 'Relatorio Semanal'}
            </DialogTitle>
          </DialogHeader>
          {reportType==='custom' && !reportData && !reportLoading && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="q">Consulta (tema/político)</Label>
                  <Input id="q" value={customForm.query} onChange={(e)=> setCustomForm(s=>({...s, query:e.target.value}))} placeholder="Inflação, PEC, STF..." />
                </div>
                <div>
                  <Label htmlFor="d">Dias</Label>
                  <Input id="d" type="number" min={1} max={30} value={customForm.days} onChange={(e)=> setCustomForm(s=>({...s, days: Math.max(1, Math.min(30, Number(e.target.value)||7))}))} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={()=> openReport('custom', customForm as any)} disabled={reportLoading}>Gerar</Button>
              </div>
            </div>
          )}
          {reportLoading && (
            <div className="py-6 text-center text-muted-foreground">Gerando relatorio…</div>
          )}
          {reportData && !reportLoading && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">{reportData.timeframeLabel}</div>
                <div className="text-base font-semibold">{reportData.title}</div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{reportData.summary}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Metricas</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
                  <div>Total: <strong>{reportData.keyMetrics.total}</strong></div>
                  <div>Polaridade media: <strong>{reportData.keyMetrics.avgSentiment.toFixed(2)}</strong></div>
                  <div>% positivas: <strong>{reportData.keyMetrics.positivePct.toFixed(1)}%</strong></div>
                  <div>Top temas: {reportData.keyMetrics.topThemes.join(', ') || '-'}</div>
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Riscos</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{reportData.risks.map((r: string,i: number)=>(<li key={i}>{r}</li>))}</ul></CardContent></Card>
              </div>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Destaques</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{reportData.highlights.map((h: string,i: number)=>(<li key={i}>{h}</li>))}</ul></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Acoes Recomendadas</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{reportData.recommendations.map((h: string,i: number)=>(<li key={i}>{h}</li>))}</ul></CardContent></Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

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





