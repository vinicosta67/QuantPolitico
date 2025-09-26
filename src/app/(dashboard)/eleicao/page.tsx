"use client"

import * as React from "react";

import { 
    demographicPollingData, 
    issueImpactData, 
    partyEfficacyData, 
    localThemesData 
} from "@/lib/data";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Scatter, ScatterChart, ZAxis } from "recharts";
import { simulateScenario, SimulateScenarioOutput } from "@/ai/flows/simulate-scenario";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import type { Kpi } from "@/lib/types";


const localIssueImpactData = [
    { state: "Sao Paulo", value: 88 },
    { state: "Pernambuco", value: 82 },
    { state: "Minas Gerais", value: 76 },
    { state: "Parana", value: 70 },
    { state: "Bahia", value: 65 },
];

type SimulationResult = {
  analysis: string;
  kpis: Kpi[];
}

export default function EleicaoPage() {
  const { toast } = useToast();
  const [hypothesis, setHypothesis] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [scenarioResult, setScenarioResult] = React.useState<SimulationResult | null>(null);

  const handleSimulate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hypothesis.trim()) {
      toast({
        variant: "destructive",
        title: "Hipótese Inválida",
        description: "Por favor, insira um cenário para simular.",
      });
      return;
    }
    
    setIsLoading(true);
    setScenarioResult(null);

    try {
      const result: SimulateScenarioOutput = await simulateScenario({ hypothesis });
      
      const formattedResult: SimulationResult = {
        analysis: result.impactAnalysis,
        kpis: result.kpiChanges.map(change => ({
          label: change.label,
          value: change.change, 
          description: change.description,
          change: change.change,
          changeType: change.changeType as 'increase' | 'decrease',
        }))
      };

      setScenarioResult(formattedResult);

    } catch (error) {
      console.error("Error simulating scenario:", error);
      toast({
        variant: "destructive",
        title: "Erro na Simulação",
        description: "Não foi possível processar a simulação. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const impactChartConfig = {
    relevance: { label: "Relevância" },
    impact: { label: "Impacto" },
  };

  const efficacyChartConfig = {
    efficacy: { label: "Eficácia", color: "hsl(var(--primary))" }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- COLUNA 1 --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pesquisa Eleitoral</CardTitle>
              <CardDescription>Intenção de voto (Estimulada)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demographicPollingData.map((poll) => (
                <div key={poll.label}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm font-medium">{poll.label}</span>
                    <span className="text-sm font-bold">{poll.value}%</span>
                  </div>
                  <Progress value={poll.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
              <CardHeader>
                  <CardTitle>Local Issue Impact</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="w-full h-full">
                      <svg fill="#008080" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 479.30 479.30" xmlSpace="preserve" stroke="#658b65"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M9.948,159.572c-0.2,2.6,1,4.5,2.4,6.5c1,1.5,2.2,3.2,2.4,4.9c0.3,2.8,1.8,3.5,4.1,4c2.6,0.6,4.7,2,5.4,4.8 c0.7,2.6,2.1,3.3,4.7,2.3c5.1-1.9,10.2-4,15.3-6c-0.1,0.6-0.3,1.5-0.4,2.4c-0.4,3.6-1,7.2-0.9,10.7c0.1,3.7,2.4,6,5.8,6 c6.6,0,13.1-0.1,19.7-0.3c3.2-0.1,6-1.3,8.2-3.8c0.3-0.3,0.7-0.8,1-0.7c3.9,0.7,6-2,8.4-4.3c2.7-2.6,5.8-4.4,9.8-4.3 c2.5,0.1,5.1-0.7,8-1.1c0,0,0.4,0.5,0.7,1.1c1.4,2.2,2,4.2,0.3,6.7c-0.8,1.3-0.4,3.4-0.5,5.2c-0.1,1.3,0.2,2.8-0.2,4 c-0.6,1.9-0.7,3.6,0.1,5.5c2.2,4.8,5.6,8.6,9.6,11.9c2.2,1.8,4.6,2.4,7.4,1.9c0.9-0.1,2,0.4,2.9,0.9c1.2,0.7,2.1,2.1,3.3,2.4 c1.8,0.5,3,1.3,4.1,2.6c1.5,1.8,3.4,3,5.8,2.6c1.8-0.3,2.6,0.2,3.1,2c1.1,3.8,3.4,4.9,7.3,4c1.1-0.3,2.6,0,3.7,0.5 c2.5,1.1,4.8,2.6,7.2,3.7c1.6,0.7,2.4,1.7,2.6,3.3c0.3,2.3,0.5,4.5,0.5,6.8c-0.1,3.1,0.3,6.3-2.4,8.8c-0.4,0.3-0.6,1.101-0.6,1.601 c0.3,2.6,0.8,5.1,2.9,6.899c3.5,3,7.6,4.8,12.2,5.2c2,0.2,4.1,0,6.2,0.1c2.7,0.101,3.6,1.4,2.9,3.9c-0.2,0.6-0.4,1.3-0.7,1.9 c-2.6,5.3-1,8.8,4.5,10.5c1.1,0.399,2.7,1.6,2.7,2.399c0.2,4.2,2,8.7-1.3,12.601c-0.4,0.399-0.8,0.899-0.9,1.5 c-0.2,1.1-0.6,2.5-0.2,3.399c0.5,1.101,0.5,1.7-0.2,2.601c-1.5,2-2.5,4-2.7,6.6c-0.3,5.3-1,10.6-1.4,15.9 c-0.2,2.6-0.3,5.3-0.2,7.899c0.1,2.2,1.3,4.101,3.5,4.601c3,0.6,6.1,1,9.1,1c8.1,0,14.1,7.199,12.7,15.199 c-0.4,2.101-0.3,4.4-0.2,6.601c0.1,2.8,1,3.399,3.8,2.899c1.3-0.199,2.6-0.6,3.9-0.699c3.2-0.2,5.5,1.8,5.1,5 c-0.4,3.6-1.1,7.3-2.3,10.699c-1.3,3.801-1.6,3.7,1.7,6.001c3.3,2.3,4.6,5.5,4.1,9.399c-0.3,2.601-1,5.101-1.1,7.7 c-0.1,4-2.8,6.1-5.8,7.1c-8.1,2.5-14.3,7.601-20.3,13.101c-3.7,3.399-6.9,7.2-10.3,10.899c-1.9,2-2,3.301-0.5,5.7 c0.4,0.7,0.8,1.4,1.3,2c2.4,3.101,5.5,5.7,4.5,10.4c-0.4,1.899,1,2.8,2.9,2.2c0.8-0.2,1.5-0.601,2.2-1.101c1.6-1.1,2.9-0.5,3.9,0.7 c3.9,4.9,8.3,9.1,13.2,12.8c2.2,1.601,3.9,3.7,4.3,6.4c0.3,2.3,1.7,2.5,3.5,2.3c1.7-0.2,3.3-0.7,5.1-1.1c1.1,2.3,2.8,2.6,4.4,0.6 c0.7-0.9,1.5-1.9,1.7-3c1.1-4.5,3.2-8.2,6.6-11.4c3.299-3.1,6.2-6.6,9.4-10.1c0.2,0.2,0.6,0.4,0.899,0.7 c2.5,2.6,5.4,2.399,7.301-0.601c1.1-1.8,2.199-3.6,3.1-5.6c1.6-3.4,3.9-5.9,6.9-8.1c2.1-1.601,3.899-3.601,5.399-5.7 c2.4-3.5,3.2-7.8,3.7-11.9c0.5-3.6,0.7-7.3,1.1-10.899c0.101-1.4,0.4-2.801,0.601-4.101c0.7-4.5,4.5-8,3.899-13 c1,0.5,1.7,1,2.5,1.4c1.4,0.6,2.5,0.399,3.2-1.2c1.5-3.6,4.7-5.3,8.101-6.3c2.7-0.9,5-2.101,7.2-3.9c2.5-2.1,5.1-4.1,8.8-3.9 c5.399,0.2,10.399-1.1,14.2-5.3c3.3-3.6,6.8-4.2,11-1.8c2.699,1.5,5.699,1.7,8.8,1.3c6-0.899,11.2-3.5,16.1-6.899 c3.8-2.7,7.2-5.801,9.2-10.2c1.3-2.9,3.3-5.2,6.4-6.4c1-0.399,2-0.8,2.699-1.5c3.9-4.7,7.801-9.5,11.601-14.399 c1.899-2.5,1-5.5,1.2-8.301c0.1-2.6,0.399-5.399,2.699-6.899c4-2.7,6-6.601,7.601-10.8c0.7-1.7,0.7-3.7,1-5.5 c-0.101-0.301,0.6-0.5,0.7-0.801c0.399-1.199,0.699-2.5,0.899-3.8c0.7-3.6,1.4-7.1,2-10.7c0.7-4.3,1.3-8.6,1.9-12.899 c0.6-4,0.8-8,1.6-12c0.5-2.8,2.101-5.3,5-6.2c9.4-3.2,15.9-9.3,18.7-18.8c1.4-4.6,4.1-6.8,8.6-7.6c5.101-0.9,9.801-2.7,12.801-7.3 c0.8-1.3,1.3-2.8,2.3-3.9c2.6-2.8,5.399-5.4,8.1-8.1c6.4-6.3,8.8-13.7,6.601-22.5c-0.801-3-1.2-6-1.7-9.1c-0.4-2.5-0.2-5.2-0.9-7.6 c-1.6-5.3-4.6-9.5-10.7-10.5c-1.699-0.3-3.3-0.8-5-1c-3.699-0.6-6.8-2.2-9.1-5c-4-5.1-7.9-10.4-11.6-15.7 c-2.4-3.4-4.2-7.1-9.101-7.5c-0.6,0-1.3-0.9-1.7-1.6c-2-3.5-5-5.3-8.899-5.7c-2.101-0.2-4.4-0.4-6.3,0.2 c-5.5,1.8-10.5,0.2-15.4-1.7c-2-0.7-4-2-5.4-3.5c-1.8-1.9-4-2.8-6.399-3.1c-4.601-0.7-8.9,0.6-13.101,2.2 c-2.1,0.8-4.3,1.6-6.699,2.4c1.1-4.3,2.1-8.2,3.199-12.1c0.5-1.9,0.301-2.9-1.699-3.7c-3-1.3-5.801-3-8.601-4.7 c-1.399-0.9-2.5-2.2-4-3.1c-5.3-3.2-11.1-5-17.2-6.2c-6.8-1.3-13.199-0.3-18.8,4.1c-2.8,2.2-5.6,4.3-8.3,6.3 c-0.9-2.1-2.2-3.9-3.8-5.3c1-0.1,2.1-0.4,3.1-0.8c2-0.8,4-1.7,5.7-2.9c3-2.3,6-4.7,8.7-7.4c1.6-1.6,1.2-2.9-0.9-3.9 c-5.8-2.8-12-3.9-18.399-3.9c-3,0-5.501,1.2-7.801,2.6c-2.399,1.5-4.5,3.3-7,4.7c-2,1.1-4.1,2.2-7.1,1.5 c0.899-1.9,1.399-3.8,2.5-5.3c4.5-6.2,10.1-11.1,16.8-14.8c1.9-1,3.5-2.3,3.101-4.8c-0.3-1.8,0.399-3,1.8-4 c1.1-0.8,2.1-1.7,3.5-2.9c-1.3-0.7-2.101-1.3-3.101-1.6c-1.899-0.7-4.1-1-5.899-1.9c-1.2-0.6-2.4-1.8-2.7-3 c-0.601-2.3-0.4-4.8-1-7.2c-1.2-5.5-2.7-11-4-16c-2.5-1.7-4.101-0.7-5.5,0.9c-1.4,1.5-3,2.8-4.3,4.4c-0.601,0.8-1.101,2-0.9,3 c0.4,3,0.4,3.5-2.4,4.2c-2.5,0.7-4,2.2-4.8,4.4c-0.6,1.6-1.8,2.4-3.399,2.8c-4.5,1.1-8.9,0.8-13.4,0.2c-3.399-0.5-6.5-1.3-8.5-4.4 c-0.399-0.7-1.399-1.2-2.1-1.3c-2.9-0.5-5.8-0.8-8.7-1.3c-2.1-0.4-3.3,0.3-4.5,2.1c-2.1,3.4-7.1,7.2-12.6,5 c-3.5-1.4-7.2-0.9-10.8,0.3c-3.4,1.1-6.9,1.9-10.4,2.5c-2.5,0.5-5,0.1-7-1.8c-4.3-4-6.8-9-7.5-14.9c-0.6-4.9,1.3-9.1,3.8-13 c2.7-4.1,2.6-4.6-1.1-7.5c-1.8-1.4-2.5-3-2-5.2c0.2-0.9,0.8-1.8,0.6-2.5c-0.2-1.1-0.7-2.5-1.5-2.9c-2.3-1.2-4.1-0.5-5.9,2 c-2.5,3.3-4.7,7-9.2,7.7c-3.2,0.5-6.5,0.8-9.8,1.1c-0.8,0.1-1.6-0.2-2.4-0.1c-2.5,0.1-3.8,1.8-5,3.7c-2.1,3.5-3,3.6-6,0.8 c-0.3-0.2-0.5-0.6-0.8-0.7c-2.7-1.4-5.3-2.8-8-3.9c-0.7-0.3-2.2,0.4-2.7,1.1c-1.8,2.5-1.8,5.4-1.1,8.3c1,3.8,2.8,6.7,6.7,8.5 c3.4,1.6,3.2,5.7,0,7.5c-1,0.6-2.2,0.9-3.2,1.5c-6.8,3.9-13.6,7.8-20.4,11.8c-1.4,0.9-2.7,0.9-4.1,0.3c-2.6-1.2-5.1-1.3-7.5,0.5 c-0.3,0.3-1.2,0.3-1.6,0c-3.1-2.1-5.6-4.6-6.3-8.6c-0.6-3.5-2.3-6.1-6.1-7c-2.6-0.6-4.9,0-7.3,0.8c-3.4,1.1-6.7,1.2-10.3,0.7 c-2.5-0.4-5.1-0.3-7.6,0c-1.7,0.2-2.8,1.6-3,3.4c-0.2,1.9,1,3,2.6,3.7c1.1,0.5,2.3,0.8,3.1,1.6c0.8,0.7,1.5,1.9,1.5,2.8 c0,0.7-1.1,1.7-1.9,2c-1.2,0.4-2.6,0.5-3.9,0.5c-4.7,0.2-6.9,3.1-5,7.4c1.2,2.7,2.9,5.3,4.8,7.6c3.5,4.5,3.9,8.7,0.7,13.3 c-1.8,2.6-3.5,5.3-2.5,8.8c0.2,0.7-0.1,1.6-0.5,2.3c-1.4,3-2.4,6.1-2.3,9.6c0,0.8-0.3,1.7-0.6,2.5c-0.5,1.8-1.4,3.6-1.5,5.4 c-0.3,4.4-2.2,6-6.3,4.7c-3.9-1.3-7.3-0.7-10.8,1.2c-1.2,0.6-2.7,0.7-4.1,0.8c-1.6,0-3.2-0.3-4.9-0.5c-0.4,2.2-1.9,3.1-3.9,3.4 c-0.5,0.1-0.9,0.4-1.3,0.7c-6.4,4.4-8.7,11.2-10.4,18.3c-0.5,1.9-0.6,3.7-2.9,4.8c-1.5,0.7-2.8,2.3-3.8,3.8 c-2.5,3.7-2.4,6.4,0.4,9.9C9.148,155.472,10.148,157.271,9.948,159.572z"></path> </g> </g></svg>
                  </div>
                  <div className="space-y-3">
                      <p className="text-sm font-semibold text-center mb-2">Top States</p>
                      {localIssueImpactData.map((item) => (
                           <div key={item.state}>
                               <div className="mb-1 flex justify-between">
                                   <span className="text-sm font-medium text-muted-foreground">{item.state}</span>
                                   <span className="text-sm font-bold">{item.value}%</span>
                               </div>
                               <Progress value={item.value} className="h-2" />
                           </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
        </div>

        {/* --- COLUNA 2 --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Impact Analysis</CardTitle>
              <CardDescription>Relevância vs. Impacto dos temas no eleitorado.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={impactChartConfig} className="h-[250px] w-full">
                  <ScatterChart margin={{top: 20, right: 30, bottom: 20, left: 20}}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="relevance" name="Relevance" unit="%" tickLine={false} axisLine={false} label={{ value: 'Relevance', position: 'insideBottom', offset: -10 }}/>
                      <YAxis type="number" dataKey="impact" name="Impact" tickLine={false} axisLine={false} label={{ value: 'Irrelevance', angle: -90, position: 'insideLeft' }}/>
                      <ZAxis type="category" dataKey="name" name="Tema" />
                      <ChartTooltip
                          cursor={{strokeDasharray: '3 3'}}
                          content={<ChartTooltipContent />}
                      />
                      <Scatter name="Temas" data={issueImpactData} fill="hsl(var(--primary))" />
                  </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Party Issue Efficacy</CardTitle>
                <CardDescription>Eficácia percebida do partido por tema.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={efficacyChartConfig} className="h-[210px] w-full">
                <BarChart data={partyEfficacyData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="issue" type="category" tickLine={false} axisLine={false} tickMargin={5} width={110} fontSize={12} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="efficacy" fill="var(--color-efficacy)" radius={4} barSize={16} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* --- COLUNA 3 --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Themes</TableHead>
                    <TableHead className="text-right">Mentions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localThemesData.map((theme) => (
                    <TableRow key={theme.theme}>
                      <TableCell className="font-medium capitalize">{theme.theme}</TableCell>
                      <TableCell className="text-right">{theme.mentions.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Local Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Themes</TableHead>
                    <TableHead>Mentions</TableHead>
                    <TableHead>Party</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localThemesData.map((theme) => (
                    <TableRow key={theme.theme}>
                      <TableCell className="font-medium capitalize">{theme.theme}</TableCell>
                      <TableCell>{theme.mentions.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{theme.party}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulador de Cenários</CardTitle>
          <CardDescription>Calcule o impacto de eventos hipotéticos na disputa presidencial.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input 
                id="hypothesis" 
                placeholder="Ex: Tarcísio anuncia novo programa de privatizações"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button type="submit" disabled={isLoading} className="whitespace-nowrap">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4"/>}
                Simular Impacto
              </Button>
            </div>
          </form>
          {isLoading && (
            <div className="mt-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground mt-2">Analisando cenário e calculando impacto...</p>
            </div>
          )}
          {scenarioResult && (
              <div className="mt-6 space-y-4 rounded-lg border bg-card p-4">
                  <h3 className="font-semibold text-lg">Resultados da Simulação</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                          <h4 className="font-medium">Análise de Impacto</h4>
                          <p className="text-sm text-muted-foreground">{scenarioResult.analysis}</p>
                      </div>
                      <div className="space-y-4">
                          <h4 className="font-medium">Variação nos KPIs</h4>
                            {scenarioResult.kpis.map((kpi) => (
                              <div key={kpi.label} className="flex justify-between items-center">
                                  <span className="text-sm">{kpi.description}</span>
                                  <div className={`flex items-center text-sm font-bold ${kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                                      {kpi.changeType === 'increase' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                      {kpi.value}
                                  </div>
                              </div>
                            ))}
                      </div>
                  </div>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}