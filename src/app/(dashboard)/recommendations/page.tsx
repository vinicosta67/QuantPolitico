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
                        <Button size="sm" variant="outline">✓ Implementar</Button>
                        <Button size="sm" variant="secondary">📊 Detalhes</Button>
                        <Button size="sm" variant="outline">📝 Nota</Button>
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
    </div>
  )
}

