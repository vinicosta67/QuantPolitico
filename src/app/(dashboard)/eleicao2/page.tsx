// app/eleicao2/page.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchElectionData, runScenario } from './actions';
import { GaugeChart, KpiCard, RadarChartComponent, ApprovalHistoryComparison } from './charts';

type ElectionData = Awaited<ReturnType<typeof fetchElectionData>>;

export default function Eleicao2Page() {
  const [data, setData] = React.useState<ElectionData>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [cargo, setCargo] = React.useState<'governador' | 'senador' | 'presidente'>('governador');
  const [estado, setEstado] = React.useState<'sp' | 'rj' | 'mg' | 'ba'>('sp');
  const [partido, setPartido] = React.useState<'partido_a' | 'partido_b' | 'partido_c'>('partido_a');
  const [fontes, setFontes] = React.useState({ midia: true, redes: true, legislativo: false });

  const [hypothesis, setHypothesis] = React.useState('');
  const [simLoading, setSimLoading] = React.useState(false);
  const [simResult, setSimResult] = React.useState<null | {
    impactAnalysis: string;
    kpiChanges: { label: string; change: string; changeType: 'increase' | 'decrease'; description: string }[];
  }>(null);

  const handleFetchData = React.useCallback(async () => {
    setIsLoading(true);
    const result = await fetchElectionData({ cargo, estado, partido, fontes });
    setData(result);
    setIsLoading(false);
  }, [cargo, estado, partido, fontes]);

  React.useEffect(() => {
    handleFetchData();
  }, [handleFetchData]);

  const getHeatmapColor = (value: number) => {
    if (value > 4) return 'bg-red-500';
    if (value > 3) return 'bg-orange-400';
    if (value > 2) return 'bg-yellow-300';
    return 'bg-green-400';
  };

  const handleSimulate = React.useCallback(async () => {
    setSimLoading(true);
    const res = await runScenario({ hypothesis });
    setSimResult(res as any);
    setSimLoading(false);
  }, [hypothesis]);

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold tracking-tighter">ELEIÇÃO</h1>

      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="cargo">Cargo</Label>
            <Select value={cargo} onValueChange={(v) => setCargo(v as any)}>
              <SelectTrigger id="cargo" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="governador">Governador</SelectItem>
                <SelectItem value="senador">Senador</SelectItem>
                <SelectItem value="presidente">Presidente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as any)}>
              <SelectTrigger id="estado" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sp">São Paulo</SelectItem>
                <SelectItem value="rj">Rio de Janeiro</SelectItem>
                <SelectItem value="mg">Minas Gerais</SelectItem>
                <SelectItem value="ba">Bahia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="partido">Partido</Label>
            <Select value={partido} onValueChange={(v) => setPartido(v as any)}>
              <SelectTrigger id="partido" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="partido_a">Partido A</SelectItem>
                <SelectItem value="partido_b">Partido B</SelectItem>
                <SelectItem value="partido_c">Partido C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow" />
          <div className="flex items-center gap-4 pb-1">
            <span className="text-sm font-medium">Fontes:</span>
            <div className="flex items-center space-x-2">
              <Checkbox id="midia" checked={fontes.midia} onCheckedChange={(v)=> setFontes((f)=>({ ...f, midia: Boolean(v) }))} />
              <Label htmlFor="midia" className="font-normal">
                Mídia
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="redes" checked={fontes.redes} onCheckedChange={(v)=> setFontes((f)=>({ ...f, redes: Boolean(v) }))} />
              <Label htmlFor="redes" className="font-normal">
                Redes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="legislativo" checked={fontes.legislativo} onCheckedChange={(v)=> setFontes((f)=>({ ...f, legislativo: Boolean(v) }))} />
              <Label htmlFor="legislativo" className="font-normal">
                Legislativo
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        data && (
          <>
            {/* Comparação de aprovação (linha) */}
            <ApprovalHistoryComparison cargo={cargo} estado={estado} />

            {/* KPIs e Gauge */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <KpiCard title="IAp" subtitle="(Aprovação - Político/UF)" value={data.kpis.iap} />
              <KpiCard title="IApP" subtitle="(Aprovação - Partido/UF Cargo)" value={data.kpis.iapP} />
              <GaugeChart value={data.kpis.its} change={0.64} />
            </div>

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Mapa de Temas Explicativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadarChartComponent data={data.mapaTemas} />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Redes Sociais</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Tema</TableHead>
                        <TableHead className="text-center">Twitter</TableHead>
                        <TableHead className="text-center">Facebook</TableHead>
                        <TableHead className="text-center">Instagram</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.redesSociais.map((item) => (
                        <TableRow key={item.tema}>
                          <TableCell className="font-medium">{item.tema}</TableCell>
                          <TableCell>
                            <div className={`h-6 w-full ${getHeatmapColor(item.twitter)} rounded-sm`} />
                          </TableCell>
                          <TableCell>
                            <div className={`h-6 w-full ${getHeatmapColor(item.facebook)} rounded-sm`} />
                          </TableCell>
                          <TableCell>
                            <div className={`h-6 w-full ${getHeatmapColor(item.instagram)} rounded-sm`} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Stakeholders */}
            <Card>
              <CardHeader>
                <CardTitle>Stakeholders‑Chave</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Impacto</TableHead>
                      <TableHead>Próximo Evento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.stakeholders.map((s) => (
                      <TableRow key={s.nome}>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell>{s.cargo}</TableCell>
                        <TableCell>{s.papel}</TableCell>
                        <TableCell className={`flex items-center font-semibold ${s.impacto > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {s.impacto > 0 ? (
                            <ArrowUp className="mr-1.5 h-4 w-4" />
                          ) : (
                            <ArrowDown className="mr-1.5 h-4 w-4" />
                          )}
                          {Math.abs(s.impacto).toFixed(2).replace('.', ',')}
                        </TableCell>
                        <TableCell>{s.proximoEvento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Simulação */}
            <Card>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Escreva sua hipótese..."
                  className="bg-slate-50"
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm space-y-1">
                    <p className="cursor-pointer text-muted-foreground hover:underline">→ Observe sua variação</p>
                    <p className="cursor-pointer text-muted-foreground hover:underline">→ Chances em aprovações‑chave</p>
                    <p className="cursor-pointer text-muted-foreground hover:underline">→ Temas (rejeição e tese do Partido)</p>
                    <p className="cursor-pointer text-muted-foreground hover:underline">→ Riscos reativos</p>
                  </div>
                  <Button size="lg" onClick={handleSimulate} disabled={simLoading}>
                    {simLoading ? 'Simulando...' : 'Simular'}
                  </Button>
                </div>

                {simResult && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Resultado do simulador</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {simResult.kpiChanges?.length ? (
                            <ul className="text-sm">
                              {simResult.kpiChanges.map((k, i) => (
                                <li key={i} className="mb-2">
                                  <span className="font-semibold">{k.label}:</span> {k.change} — {k.description}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sem alterações de KPI.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Análise</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{simResult.impactAnalysis}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}
