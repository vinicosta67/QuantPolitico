"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, RefreshCw, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { searchNews, generateNewsReportAction } from "./actions";
import { sendLatestNewsToWhatsApp, sendDemoNewsToWhatsApp, getDemoNewsMessage, getDemoNewsMessages } from "./whatsapp";
import type { NewsArticle } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

type ExtendedNews = (NewsArticle & { publishedAtLabel: string }) & {
  sentiment_score: number;
  confidence_score: number;
  category: "economia" | "saude" | "educacao" | "seguranca";
  politicians_mentioned: string[];
  emotion_primary: "alegria" | "raiva" | "tristeza" | "neutro";
  content?: string;
};

function enrichNews(items: (NewsArticle & { publishedAtLabel: string })[]): ExtendedNews[] {
  const categories = ["economia", "saude", "educacao", "seguranca"] as const;
  const politicians = ["Lula", "Bolsonaro", "Tarcísio", "Boulos"];
  return items.map((n, idx) => {
    const seed = (n.title.length + idx * 7) % 100;
    const rand = (min: number, max: number) => min + ((seed / 100) * (max - min));
    const sentiment = parseFloat(rand(-0.6, 0.8).toFixed(2));
    const confidence = parseFloat(rand(0.7, 0.95).toFixed(2));
    const category = categories[idx % categories.length];
    const emotion = (['alegria', 'raiva', 'tristeza', 'neutro'] as const)[idx % 4];
    const who = [politicians[idx % politicians.length]];
    return {
      ...n,
      sentiment_score: sentiment,
      confidence_score: confidence,
      category,
      emotion_primary: emotion,
      politicians_mentioned: who,
      content: n.summary,
    };
  });
}

export default function NoticiasPage() {
  const { toast } = useToast();
  const [allNews, setAllNews] = React.useState<ExtendedNews[]>([]);
  const [filteredNews, setFilteredNews] = React.useState<ExtendedNews[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'analysis'|'search'|'trends'|'monitoring'|'reports'>('analysis');

  // Monitor page states (mock)
  const [systemMetrics, setSystemMetrics] = React.useState({
    total_news: 305,
    total_politicians: 512,
    total_analysis: 1686,
    avg_sentiment: 0.3,
    positive_percentage: 62.4,
    categories: 12,
  });
  type Trend = { date: string; news_count: number; avg_sentiment: number; positive_count: number; negative_count: number };
  const [trends, setTrends] = React.useState<Trend[]>([]);
  const [searchForm, setSearchForm] = React.useState({ query: '', politician: 'all' as 'all'|'Lula'|'Bolsonaro'|'Tarcísio'|'Boulos', days: 7 as 1|7|30|90, sentiment: 'all' as 'all'|'positive'|'negative'|'neutral' });
  const [searchResults, setSearchResults] = React.useState<ExtendedNews[]>([]);

  // Reports UI state
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportType, setReportType] = React.useState<'daily'|'weekly'|'custom'>('daily');
  const [reportData, setReportData] = React.useState<null | {
    title: string; timeframeLabel: string; summary: string;
    keyMetrics: { total: number; avgSentiment: number; positivePct: number; topThemes: string[] };
    highlights: string[]; risks: string[]; recommendations: string[];
  }>(null);
  const [customForm, setCustomForm] = React.useState({ query: '', days: 7 });

  const [filters, setFilters] = React.useState({
    query: "",
    category: "all",
    sentiment: "all",
    politician: "all",
    hours: 24 as 6 | 12 | 24 | 48 | 168,
  });

  const loadNews = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchNews(filters.query || undefined);
      const enriched = enrichNews(data);
      setAllNews(enriched);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar notícias — usando dados locais.");
      setAllNews([]);
    } finally {
      setLoading(false);
    }
  }, [filters.query]);

  React.useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Build trends mock once
  React.useEffect(() => {
    const now = new Date();
    const arr: Trend[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 3600 * 1000);
      const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const news_count = Math.floor(30 + Math.random()*50);
      const avg_sentiment = parseFloat((Math.random()*2 - 1).toFixed(2));
      const positive_count = Math.floor(news_count * (0.4 + Math.random()*0.3));
      const negative_count = Math.max(1, Math.floor(news_count * (0.15 + Math.random()*0.2)));
      return { date, news_count, avg_sentiment, positive_count, negative_count };
    });
    setTrends(arr);
  }, []);

  React.useEffect(() => {
    let id: any;
    if (autoRefresh) id = setInterval(loadNews, 30000);
    return () => id && clearInterval(id);
  }, [autoRefresh, loadNews]);

  React.useEffect(() => {
    let items = [...allNews];
    const cutoff = Date.now() - filters.hours * 3600 * 1000;
    items = items.filter(n => new Date(n.publishedAt).getTime() >= cutoff);
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      items = items.filter(n => n.title.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q));
    }
    if (filters.category !== 'all') items = items.filter(n => n.category === filters.category);
    if (filters.sentiment === 'positive') items = items.filter(n => n.sentiment_score > 0.1);
    if (filters.sentiment === 'neutral') items = items.filter(n => Math.abs(n.sentiment_score) <= 0.1);
    if (filters.sentiment === 'negative') items = items.filter(n => n.sentiment_score < -0.1);
    if (filters.politician !== 'all') items = items.filter(n => n.politicians_mentioned?.includes(filters.politician));
    setFilteredNews(items);
  }, [allNews, filters]);

  const sentimentColor = (score: number) => score > 0.2 ? 'text-green-600' : score < -0.2 ? 'text-red-600' : 'text-yellow-600';
  const sentimentBar = (score: number) => score > 0.2 ? 'bg-emerald-500' : score < -0.2 ? 'bg-red-500' : 'bg-yellow-500';
  const sentimentEmoji = (score: number) => score > 0.2 ? '😊' : score < -0.2 ? '😠' : '😐';
  const confidenceColor = (v: number) => v >= 0.85 ? 'text-green-600' : v <= 0.7 ? 'text-red-600' : 'text-yellow-600';
  const positivePctColor = (pct: number) => pct >= 66 ? 'text-green-600' : pct <= 44 ? 'text-red-600' : 'text-yellow-600';

  // Metrics (derivados)
  const metrics = React.useMemo(() => {
    const total = allNews.length || 1;
    const avg = allNews.reduce((s, n) => s + (n.sentiment_score || 0), 0) / total;
    const positive = allNews.filter(n => n.sentiment_score > 0.1).length / (allNews.length || 1) * 100;
    const conf = allNews.reduce((s, n) => s + (n.confidence_score || 0.8), 0) / total;
    return { total: allNews.length, sentimentAvg: avg, positivePercentage: positive, confidenceAvg: conf };
  }, [allNews]);

  // Helper derived values for trends (safe during initial render)
  const lastTrend = trends.length ? trends[trends.length - 1] : null;

  // WhatsApp (server-side send via API)
  const [sending, setSending] = React.useState(false);
  const handleSendWhatsAppAPI = async () => {
    try {
      setSending(true);
      await sendLatestNewsToWhatsApp({
        query: filters.query || undefined,
        category: filters.category as any,
        sentiment: filters.sentiment as any,
        politician: filters.politician as any,
        hours: filters.hours,
        limit: 2,
      });
      toast({ title: "Enviado", description: "As 5 últimas notícias foram enviadas para o WhatsApp." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Falha no envio", description: e?.message || "Verifique as credenciais do provedor.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };
  // Envio detalhado: retorna SIDs/status e mostra em toast
  const handleSendWhatsAppAPIDetailed = async () => {
    try {
      setSending(true);
      const result = await sendLatestNewsToWhatsApp({
        query: filters.query || undefined,
        category: filters.category as any,
        sentiment: filters.sentiment as any,
        politician: filters.politician as any,
        hours: filters.hours,
        limit: 2,
      });
      const detail = result?.results?.map((r: any) => r?.sid ? `SID ${r.sid} (${r.status})` : null).filter(Boolean).join(', ');
      // Mostra quantidade e alguns SIDs
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      alert(`Twilio: enviados ${result?.sent}/${result?.attempts}. ${detail || ''}`);
    } catch (e: any) {
      console.error(e);
      alert(`Falha no envio: ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  };

  // Abre DEMO no WhatsApp Web (wa.me) para visualizar as mensagens
  const handleOpenWhatsAppDemo = async () => {
    try {
      const msgs: string[] = await getDemoNewsMessages() as any;
      if (!Array.isArray(msgs) || msgs.length === 0) {
        alert('Sem mensagens para abrir.');
        return;
      }
      msgs.forEach((m, i) => setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(m)}`, '_blank'), i * 200));
    } catch (e: any) {
      console.error(e);
      alert(`Falha ao abrir demo: ${e?.message || e}`);
    }
  };
  // WhatsApp integration
  const WHATSAPP_NUMBER = "5599999999999"; // número fictício (use DDI+DDD+número)
  const formatSentimentLabel = (v: number) => (v > 0.2 ? "Positivo" : v < -0.2 ? "Negativo" : "Neutro");
  function buildWhatsAppMessage(items: ExtendedNews[]) {
    const header = `Últimas notícias (${new Date().toLocaleString('pt-BR')}):`;
    const lines = items.map((n, i) => {
      const tags = [n.category, ...(n.politicians_mentioned || [])]
        .filter(Boolean)
        .map(t => `#${t}`)
        .join(" ");
      const subtitle = n.content || n.summary || "";
      const sLabel = formatSentimentLabel(n.sentiment_score);
      return [
        `${i + 1}) ${n.title}`,
        subtitle ? `Subtítulo: ${subtitle}` : undefined,
        `Sentimento: ${sLabel} (${n.sentiment_score.toFixed(2)})`,
        `Tags: ${tags || '-'}`,

        n.url ? `Link: ${n.url}` : undefined,
      ].filter(Boolean).join("\n");
    });
    return [header, "", ...lines].join("\n");
  }
  const handleSendWhatsApp = () => {
    if (!filteredNews.length) {
      toast({ title: "Sem notícias", description: "Nenhuma notícia disponível para enviar." });
      return;
    }
    const items = filteredNews.slice(0, 5);
    const message = buildWhatsAppMessage(items);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Report actions
  const openReport = React.useCallback(async (type: 'daily'|'weekly'|'custom', custom?: {query?: string; days?: number}) => {
    try {
      setReportType(type);
      setReportOpen(true);
      setReportLoading(true);
      const input = {
        type,
        query: custom?.query ?? filters.query ?? '',
        days: custom?.days ?? (type==='daily'?1:type==='weekly'?7:7),
      } as any;
      const data = await generateNewsReportAction(input);
      setReportData(data as any);
    } catch (e) {
      console.error('Falha ao gerar relatório', e);
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  }, [filters.query]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Notícias</h2>
          <p className="text-muted-foreground">Feed de notícias com análise emocional</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
          <Button variant={autoRefresh ? 'default' : 'outline'} size="sm" onClick={() => setAutoRefresh(v => !v)}>
            {autoRefresh ? '🟢 Auto' : '⭕ Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadNews} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
            Atualizar
          </Button>
          <Button size="sm" onClick={handleSendWhatsAppAPI} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Enviar 2 via WhatsApp
          </Button>
          {/* <Button size="sm" variant="secondary" onClick={handleSendWhatsAppAPIDetailed} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Enviar 5 (detalhado)
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenWhatsAppDemo}>
            Abrir demo no WhatsApp
          </Button> */}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total de Notícias</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sentimento Médio</CardTitle></CardHeader>
          <CardContent className={`text-2xl font-bold ${sentimentColor(metrics.sentimentAvg)}`}>{metrics.sentimentAvg.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notícias Positivas</CardTitle></CardHeader>
          <CardContent className={`text-2xl font-bold ${positivePctColor(metrics.positivePercentage)}`}>{metrics.positivePercentage.toFixed(1)}%</CardContent>
        </Card>
        {/* Removed Confiança card as requested */}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="query">Busca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="query" className="pl-10" placeholder="Ex: reforma tributária" value={filters.query} onChange={(e)=> setFilters(f=>({...f, query:e.target.value}))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filters.category} onValueChange={(v)=> setFilters(f=>({...f, category:v}))}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="economia">Economia</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="seguranca">Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sentimento</Label>
              <Select value={filters.sentiment} onValueChange={(v)=> setFilters(f=>({...f, sentiment:v}))}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Político</Label>
              <Select value={filters.politician} onValueChange={(v)=> setFilters(f=>({...f, politician:v}))}>
                <SelectTrigger><SelectValue placeholder="Todos"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Lula">Lula</SelectItem>
                  <SelectItem value="Bolsonaro">Bolsonaro</SelectItem>
                  <SelectItem value="Tarcísio">Tarcísio</SelectItem>
                  <SelectItem value="Boulos">Boulos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>Período</Label>
              <Select value={String(filters.hours)} onValueChange={(v)=> setFilters(f=>({...f, hours: Number(v) as any}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                  <SelectItem value="168">7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <small className="text-muted-foreground">Mostrando {filteredNews.length} de {allNews.length} notícias</small>
            <Button variant="outline" size="sm" onClick={()=> setFilters({ query:'', category:'all', sentiment:'all', politician:'all', hours:24 })}>Limpar filtros</Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Feed de Notícias {loading && <Loader2 className="ml-2 inline h-4 w-4 animate-spin"/>}</CardTitle>
          {error && <CardDescription>{error}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading && filteredNews.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Carregando notícias...</div>
          ) : filteredNews.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhuma notícia encontrada</div>
          ) : (
            <div className="space-y-3">
              {filteredNews.map((n, idx) => (
                <div key={n.id || idx} className="rounded border p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <a href={n.url} target="_blank" rel="noreferrer" className="hover:underline">
                        <h3 className="truncate text-base font-semibold">
                          {n.title}
                        </h3>
                      </a>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary">{n.source}</Badge>
                        <Badge variant="outline">{n.category}</Badge>
                        {n.politicians_mentioned?.map(p => (
                          <Badge key={p}>{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`mb-1 text-sm font-medium ${sentimentColor(n.sentiment_score)}`}>
                        {sentimentEmoji(n.sentiment_score)} {n.sentiment_score.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">{n.publishedAtLabel}</div>
                    </div>
                  </div>
                  <p className="mb-2 line-clamp-3 text-sm text-muted-foreground">{n.content ?? n.summary}</p>
                  <div className="flex items-center justify-between gap-3">

                    <div className="w-40">
                      <Progress value={Math.round(n.confidence_score * 100)} className="h-1.5" indicatorClassName={sentimentBar(n.sentiment_score)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitor de Notícias */}
      <Card>
        <CardHeader>
          <CardTitle>Monitor de Notícias</CardTitle>
          <CardDescription>Análise e monitoramento avançado (mock)</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v)=> setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="analysis">Análise</TabsTrigger>
              <TabsTrigger value="search">Busca</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total de Notícias</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{systemMetrics.total_news}</CardContent></Card>
                
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sentimento Médio</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${sentimentColor(systemMetrics.avg_sentiment)}`}>{systemMetrics.avg_sentiment.toFixed(2)}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">% Positivas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{systemMetrics.positive_percentage.toFixed(1)}%</CardContent></Card>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo Executivo</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Sistema processou {systemMetrics.total_news} notícias nas últimas 24h.</p>
                    <p>{systemMetrics.total_politicians} políticos monitorados • {systemMetrics.total_analysis} análises geradas.</p>
                    <p>Tendência {systemMetrics.avg_sentiment>0.2?'positiva':systemMetrics.avg_sentiment<-0.2?'negativa':'neutra'}.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span>Processamento de sentimentos</span><span>92%</span></div>
                      <Progress value={92} />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span>Coleta de notícias</span><span>98%</span></div>
                      <Progress value={98} />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span>Classificação temática</span><span>85%</span></div>
                      <Progress value={85} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Termo de busca</Label>
                    <Input value={searchForm.query} onChange={(e)=> setSearchForm(s=>({...s, query:e.target.value}))} placeholder="economia, reforma..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Político</Label>
                    <Select value={searchForm.politician} onValueChange={(v)=> setSearchForm(s=>({...s, politician: v as any}))}>
                      <SelectTrigger><SelectValue placeholder="Todos"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Lula">Lula</SelectItem>
                        <SelectItem value="Bolsonaro">Bolsonaro</SelectItem>
                        <SelectItem value="Tarcísio">Tarcísio</SelectItem>
                        <SelectItem value="Boulos">Boulos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período (dias)</Label>
                    <Select value={String(searchForm.days)} onValueChange={(v)=> setSearchForm(s=>({...s, days: Number(v) as any}))}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Hoje</SelectItem>
                        <SelectItem value="7">Última semana</SelectItem>
                        <SelectItem value="30">Último mês</SelectItem>
                        <SelectItem value="90">3 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sentimento</Label>
                    <Select value={searchForm.sentiment} onValueChange={(v)=> setSearchForm(s=>({...s, sentiment: v as any}))}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="positive">Positivo</SelectItem>
                        <SelectItem value="negative">Negativo</SelectItem>
                        <SelectItem value="neutral">Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={()=>{
                    // simple mock: filter from allNews according to form
                    let items = [...allNews];
                    if (searchForm.query.trim()) {
                      const q = searchForm.query.toLowerCase();
                      items = items.filter(n=> n.title.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q));
                    }
                    if (searchForm.politician !== 'all') items = items.filter(n=> n.politicians_mentioned?.includes(searchForm.politician));
                    if (searchForm.sentiment==='positive') items = items.filter(n=> n.sentiment_score>0.1);
                    if (searchForm.sentiment==='negative') items = items.filter(n=> n.sentiment_score<-0.1);
                    if (searchForm.sentiment==='neutral') items = items.filter(n=> Math.abs(n.sentiment_score)<=0.1);
                    const cutoff = Date.now() - searchForm.days*24*3600*1000;
                    items = items.filter(n=> new Date(n.publishedAt).getTime()>=cutoff);
                    setSearchResults(items);
                  }}>Buscar</Button>
                </div>
                <div className="md:col-span-2">
                  {searchResults.length? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Notícia</TableHead>
                          <TableHead>Fonte</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Sentimento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((n,i)=> (
                          <TableRow key={n.id||i}>
                            <TableCell className="font-medium">{n.title}<div className="text-xs text-muted-foreground">{n.politicians_mentioned?.[0] ? `👤 ${n.politicians_mentioned[0]}`:''}</div></TableCell>
                            <TableCell>{n.source}</TableCell>
                            <TableCell className="text-xs">{n.publishedAtLabel}</TableCell>
                            <TableCell className={sentimentColor(n.sentiment_score)}>
                              {n.sentiment_score>0.2?'Positivo':n.sentiment_score<-0.2?'Negativo':'Neutro'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-sm text-muted-foreground">Use os filtros à esquerda para buscar notícias.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-4">
              {trends.length>0 && (
                <ChartContainer config={{}} className="h-[350px] w-full">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" label={{ value: 'Volume', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[-1,1]} label={{ value: 'Sentimento', angle: 90, position: 'insideRight' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="news_count" stroke="hsl(var(--primary))" name="Volume de Notícias" />
                    <Line yAxisId="right" type="monotone" dataKey="avg_sentiment" stroke="#10b981" name="Sentimento Médio" />
                  </LineChart>
                </ChartContainer>
              )}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Sentimento</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Notícias Positivas</TableCell><TableCell className="text-right">{trends.reduce((s,t)=>s+t.positive_count,0)}</TableCell></TableRow>
                        <TableRow><TableCell>Notícias Negativas</TableCell><TableCell className="text-right">{trends.reduce((s,t)=>s+t.negative_count,0)}</TableCell></TableRow>
                        <TableRow><TableCell>Total Processadas</TableCell><TableCell className="text-right">{trends.reduce((s,t)=>s+t.news_count,0)}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Insights</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Tendência geral: {(lastTrend?.avg_sentiment ?? 0) > 0 ? 'Positiva' : 'Negativa'}</p>
                    <p>Pico de volume: {trends.length ? Math.max(...trends.map(t=>t.news_count)) : 0} notícias/dia</p>
                    <p>Média semanal: {(
                      trends.length ? trends.reduce((s,t)=>s+t.news_count,0)/trends.length : 0
                    ).toFixed(0)} notícias/dia</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Status do Sistema</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Coleta de notícias</TableCell><TableCell className="text-right"><Badge>Ativo</Badge></TableCell></TableRow>
                        <TableRow><TableCell>Análise de sentimento</TableCell><TableCell className="text-right"><Badge>Operacional</Badge></TableCell></TableRow>
                        <TableRow><TableCell>Processamento de dados</TableCell><TableCell className="text-right"><Badge variant="secondary">Moderado</Badge></TableCell></TableRow>
                        <TableRow><TableCell>Agentes IA</TableCell><TableCell className="text-right"><Badge>Conectados</Badge></TableCell></TableRow>
                      </TableBody>
                    </Table>
                    <div className="mt-3 text-xs text-muted-foreground">Última atualização: {new Date().toLocaleString('pt-BR')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Métricas em Tempo Real</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span>Notícias/hora</span><span>42</span></div>
                      <Progress value={85} />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span>CPU</span><span>67%</span></div>
                      <Progress value={67} />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span>Processamento IA</span><span>92%</span></div>
                      <Progress value={92} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Relatório Diário</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Análise das últimas 24h <br></br><Button className="mt-3" size="sm" onClick={()=> openReport('daily')}>Gerar</Button></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Relatório Semanal</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Tendências e insights <br></br><Button className="mt-3" size="sm" variant="outline" onClick={()=> openReport('weekly')}>Gerar</Button></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Relatório Personalizado</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Parâmetros específicos <Button className="mt-3" size="sm" variant="outline" onClick={()=> setReportOpen(true) || setReportType('custom') || setReportData(null)}>Configurar</Button></CardContent></Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={(o)=>{ setReportOpen(o); if(!o){ setReportData(null); setReportLoading(false);} }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {reportType==='custom' ? 'Relatório Personalizado' : reportType==='daily' ? 'Relatório Diário' : 'Relatório Semanal'}
            </DialogTitle>
          </DialogHeader>
          {reportType==='custom' && !reportData && (
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
            <div className="py-6 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Gerando relatório…</div>
          )}
          {reportData && !reportLoading && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">{reportData.timeframeLabel}</div>
                <div className="text-base font-semibold">{reportData.title}</div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{reportData.summary}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Métricas</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
                  <div>Total: <strong>{reportData.keyMetrics.total}</strong></div>
                  <div>Polaridade média: <strong>{reportData.keyMetrics.avgSentiment.toFixed(2)}</strong></div>
                  <div>% positivas: <strong>{reportData.keyMetrics.positivePct.toFixed(1)}%</strong></div>
                  <div>Top temas: {reportData.keyMetrics.topThemes.join(', ') || '-'}</div>
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Riscos</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{reportData.risks.map((r,i)=>(<li key={i}>{r}</li>))}</ul></CardContent></Card>
              </div>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Destaques</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{reportData.highlights.map((h,i)=>(<li key={i}>{h}</li>))}</ul></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ações Recomendadas</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{reportData.recommendations.map((h,i)=>(<li key={i}>{h}</li>))}</ul></CardContent></Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

