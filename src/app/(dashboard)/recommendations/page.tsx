"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchRecommendations, fetchQuickStats } from "./actions";
import { generateRecommendationPlanAction, fetchPlanNewsAction, type NewsGroup } from "./actions";
import { planToPdfBytes } from "@/lib/plan-pdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type RecType = 'strategic' | 'media' | 'social'
type Timeframe = 'day' | 'week' | 'month' | 'quarter'

function priorityClasses(priority: 'high'|'medium'|'low') {
  return priority === 'high' ? 'border-l-4 border-red-500' : priority === 'medium' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-blue-500'
}

function urgencyIcon(u: 'high'|'medium'|'low') {
  return u === 'high' ? '⚡' : u === 'medium' ? '🟡' : '🟢'
}

function categoryIcon(c: string) {
  const map: Record<string,string> = { messaging:'📢', digital:'📱', crisis:'🆘', media:'📺', timing:'⏰', content:'📝', monitoring:'🔍' }
  return map[c] || '💡'
}

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = React.useState<RecType>('strategic')
  const [politician, setPolitician] = React.useState('Lula')
  const [timeframe, setTimeframe] = React.useState<Timeframe>('week')
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState<{active:number;implemented:number;pending:number;successRate:number}>({active:0,implemented:0,pending:0,successRate:0})
  const [generating, setGenerating] = React.useState(false)
  const [lastPlan, setLastPlan] = React.useState<any|null>(null)
  const [newsOpen, setNewsOpen] = React.useState(false)
  const [newsLoading, setNewsLoading] = React.useState(false)
  const [newsGroups, setNewsGroups] = React.useState<NewsGroup[]|null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [detailsLoading, setDetailsLoading] = React.useState(false)
  const [detailsPlan, setDetailsPlan] = React.useState<any|null>(null)
  const [detailsRec, setDetailsRec] = React.useState<any|null>(null)

  const load = React.useCallback(async ()=>{
    setLoading(true)
    try {
      const [recs, qs] = await Promise.all([
        fetchRecommendations({ politician, type: activeTab, timeframe }),
        fetchQuickStats()
      ])
      setItems(recs)
      setStats(qs)
    } finally {
      setLoading(false)
    }
  }, [politician, timeframe, activeTab])

  React.useEffect(()=>{ load() }, [load])

  const handleGeneratePdf = React.useCallback(async () => {
    try {
      setGenerating(true)
      const plan = await generateRecommendationPlanAction({
        politician,
        type: activeTab,
        timeframe,
        items,
      })
      setLastPlan(plan as any)
      const pdfBytes = await planToPdfBytes(plan, { politician, type: activeTab, timeframe })
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0,10)
      a.href = url
      a.download = `Plano_${politician}_${activeTab}_${stamp}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Falha ao gerar PDF', e)
      alert('Não foi possível gerar o PDF do plano agora.')
    } finally {
      setGenerating(false)
    }
  }, [politician, activeTab, timeframe, items])

  const handleViewNews = React.useCallback(async () => {
    try {
      setNewsLoading(true)
      const competitors = Array.isArray((lastPlan as any)?.competitiveStrategies)
        ? (lastPlan as any).competitiveStrategies.map((c: any)=> c?.competitor).filter(Boolean)
        : []
      const groups = await fetchPlanNewsAction({ politician, timeframe, competitors })
      setNewsGroups(groups)
      setNewsOpen(true)
    } catch (e) {
      console.error('Falha ao buscar notícias', e)
      alert('Não foi possível carregar as notícias agora.')
    } finally {
      setNewsLoading(false)
    }
  }, [politician, timeframe, lastPlan])

  const handleOpenDetails = React.useCallback(async (rec: any) => {
    try {
      setDetailsRec(rec)
      setDetailsOpen(true)
      setDetailsLoading(true)
      const plan = await generateRecommendationPlanAction({ politician, type: activeTab, timeframe, items: [rec] })
      setDetailsPlan(plan as any)
    } catch (e) {
      console.error('Falha ao gerar detalhes', e)
      setDetailsPlan(null)
    } finally {
      setDetailsLoading(false)
    }
  }, [politician, activeTab, timeframe])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Recomendações</h2>
        <p className="text-muted-foreground">Insights estratégicos baseados em dados (mock)</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Político</label>
            <Select value={politician} onValueChange={(v)=> setPolitician(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Lula">Lula</SelectItem>
                <SelectItem value="Bolsonaro">Bolsonaro</SelectItem>
                <SelectItem value="Tarcísio">Tarcísio</SelectItem>
                <SelectItem value="Boulos">Boulos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Período</label>
            <Select value={timeframe} onValueChange={(v)=> setTimeframe(v as Timeframe)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">24 horas</SelectItem>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
                <SelectItem value="quarter">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com recomendações */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={(v)=> setActiveTab(v as RecType)}>
            <TabsList>
              <TabsTrigger value="strategic">🎯 Estratégico</TabsTrigger>
              <TabsTrigger value="media">📺 Mídia</TabsTrigger>
              <TabsTrigger value="social">📱 Social</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {/* <Button size="sm" onClick={handleGeneratePdf} disabled={generating || loading}>
              {generating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Gerando PDF…</>) : 'Gerar Plano (PDF)'}
            </Button> */}
            <Button size="sm" variant="outline" onClick={handleViewNews} disabled={newsLoading}>
              {newsLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Carregando…</>) : 'Ver notícias usadas'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Carregando recomendações…</div>
          ) : items.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">Nenhuma recomendação disponível</div>
          ) : (
            <div className="space-y-3">
              {items.map((rec) => (
                <Card key={rec.id} className={priorityClasses(rec.priority)}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold">{categoryIcon(rec.category)} {rec.title}</h3>
                          <Badge variant={rec.priority==='high'?'destructive':rec.priority==='medium'?'default':'secondary'}>{rec.priority.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{urgencyIcon(rec.urgency)} {rec.urgency}</Badge>
                          <Badge variant="outline">📅 {rec.timeframe}</Badge>
                          <Badge variant="outline">🎯 Impacto: {rec.impact_score}/10</Badge>
                        </div>
                      </div>
                    </div>
                    {rec.evidence && (
                      <Card className="mb-3 border-dashed"><CardContent className="p-3 text-xs text-muted-foreground"><strong>🔍 Evidência:</strong> {rec.evidence}</CardContent></Card>
                    )}
                    {rec.actions?.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium">⚡ Ações Recomendadas</h4>
                        <Table>
                          <TableBody>
                            {rec.actions.map((a: string, i: number)=> (
                              <TableRow key={i}><TableCell className="w-8 text-xs">{i+1}</TableCell><TableCell className="text-sm">{a}</TableCell></TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>📅 Criado: {rec.created_date.replace('T',' ').slice(0,16)}</span>
                      <div className="flex gap-2">
                        <Button onClick={handleGeneratePdf} size="sm" variant="secondary" disabled={generating}> {generating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Implementando…</>) :'✓ Implementar'}</Button>
                        <Button size="sm" variant="secondary" onClick={()=> handleOpenDetails(rec)}>📊 Detalhes</Button>
                        {/* <Button size="sm" variant="outline">📝 Nota</Button> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Recomendações Ativas</CardTitle></CardHeader><CardContent className="text-center text-2xl font-bold">{stats.active}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Implementadas</CardTitle></CardHeader><CardContent className="text-center text-2xl font-bold text-green-600">{stats.implemented}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader><CardContent className="text-center text-2xl font-bold text-yellow-600">{stats.pending}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Sucesso</CardTitle></CardHeader><CardContent className="text-center text-2xl font-bold text-primary">{stats.successRate}%</CardContent></Card>
      </div>

      {/* News dialog */}
      <Dialog open={newsOpen} onOpenChange={setNewsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notícias usadas (últimos {timeframe === 'day' ? '1' : timeframe === 'week' ? '7' : '14'} dias)</DialogTitle>
          </DialogHeader>
          {!newsGroups || newsGroups.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma notícia encontrada para as consultas.</div>
          ) : (
            <div className="space-y-4">
              {newsGroups.map((g, gi)=> (
                <div key={gi} className="space-y-2">
                  <div className="text-sm font-semibold">Consulta: {g.query} {g.ok ? '' : '(falha)'}</div>
                  <ul className="space-y-1">
                    {g.items.map((a, ai)=> (
                      <li key={ai} className="text-sm">
                        <a href={a.url} target="_blank" rel="noreferrer" className="underline">
                          {a.title}
                        </a>
                        <span className="text-muted-foreground"> — {a.source} — {new Date(a.publishedAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onOpenChange={(o)=> { setDetailsOpen(o); if(!o){ setDetailsPlan(null); setDetailsRec(null); }}}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da recomendação</DialogTitle>
          </DialogHeader>
          {detailsLoading && (
            <div className="py-4 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Carregando…</div>
          )}
          {!detailsLoading && detailsPlan && (
            <div className="space-y-4">
              <div>
                <div className="text-base font-semibold">{detailsPlan.title}</div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{detailsPlan.summary}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Objetivos</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{detailsPlan.objectives?.map((o:string,i:number)=>(<li key={i}>{o}</li>))}</ul></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Riscos</CardTitle></CardHeader><CardContent className="text-sm"><ul className="list-disc pl-5 space-y-1">{detailsPlan.risks?.map((r:string,i:number)=>(<li key={i}>{r}</li>))}</ul></CardContent></Card>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Ações</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-3">
                  {detailsPlan.actions?.map((a:any, i:number)=> (
                    <div key={i}>
                      <div className="font-medium">{a.title}</div>
                      <ul className="list-disc pl-5 space-y-1 mt-1">{a.steps?.map((s:string, si:number)=> (<li key={si}>{s}</li>))}</ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Timeline</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  {detailsPlan.timeline?.map((t:any, i:number)=> (
                    <div key={i}>
                      <div className="font-medium">{t.label}</div>
                      <ul className="list-disc pl-5 space-y-1 mt-1">{t.deliverables?.map((d:string, di:number)=> (<li key={di}>{d}</li>))}</ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
