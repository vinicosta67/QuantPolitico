"use client"

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

// Importando os dados do seu arquivo data.ts
import { 
    politicianData,
    ministerialIndexData,
    sentimentPolarityData,
    relevantTopics1,
    relevantTopics2,
    competitionData
} from "@/lib/data";

const lineChartConfig = {
  positive: { label: "Positivo", color: "hsl(var(--chart-2))" },
  neutral: { label: "Neutro", color: "hsl(var(--muted-foreground))" },
  negative: { label: "Negativo", color: "hsl(var(--destructive))" },
};

const barChartConfig = {
    value: { label: "Valor", color: "hsl(var(--primary))" }
};

export default function GovernoPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* --- COLUNA 1 --- */}
      <div className="space-y-6">
        <Card>
            <CardHeader className="p-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Jao Silva" className="pl-8" defaultValue="Jao Silva" />
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                <Image
                    src={politicianData.imageUrl}
                    alt={`Foto de ${politicianData.name}`}
                    width={96}
                    height={96}
                    className="rounded-full mb-4"
                />
                <div className="grid grid-cols-2 gap-4 w-full text-left text-sm mb-4">
                    <div>
                        <p className="text-muted-foreground">Situação</p>
                        <p className="font-semibold">{politicianData.status}</p>
                    </div>
                     <div>
                        <p className="text-muted-foreground">Partido</p>
                        <p className="font-semibold">{politicianData.party}</p>
                    </div>
                </div>

                <div className="w-full space-y-3 text-left">
                    <div>
                        <div className="flex justify-between mb-1 text-sm font-medium">
                            <span>Popularidade</span>
                            <span>{politicianData.popularity}%</span>
                        </div>
                        <Progress value={politicianData.popularity} className="h-2" />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1 text-sm font-medium">
                            <span>Aprovação</span>
                            <span>{politicianData.approval}%</span>
                        </div>
                        <Progress value={politicianData.approval} className="h-2 [&>div]:bg-destructive" /> 
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Índice Ministerial</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{
                        positive: { label: "Positivo", color: "hsl(var(--chart-2))" },
                        neutral: { label: "Neutro", color: "hsl(var(--muted))" },
                        negative: { label: "Negativo", color: "hsl(var(--destructive))" },
                    }}
                    className="h-[220px] w-full"
                >
                    <BarChart layout="vertical" data={ministerialIndexData} barCategoryGap={12}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={90}/>
                        <Tooltip content={<ChartTooltipContent hideLabel formatter={(value: any, name?: any) => (
                          <div className="flex w-full justify-between"><span className="text-muted-foreground">{name}</span><span className="font-mono">{Number(value).toFixed(0)}%</span></div>
                        )} />} />
                        <Legend />
                        <Bar dataKey="positive" fill="hsl(var(--chart-2))" stackId="a" radius={[4, 0, 0, 4]} />
                        <Bar dataKey="neutral" fill="hsl(var(--muted))" stackId="a" />
                        <Bar dataKey="negative" fill="hsl(var(--destructive))" stackId="a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Análise de Sentimento</CardTitle>
                <CardDescription className="text-xs">Por Polaridade</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={lineChartConfig} className="h-[150px] w-full">
                    <LineChart data={sentimentPolarityData} margin={{ left: -20, right: 20, top: 10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                        <ChartTooltip content={<ChartTooltipContent hideLabel indicator="line" />} />
                        <Legend content={() => null} />
                        <Line dataKey="positive" stroke="var(--color-positive)" strokeWidth={2} dot={false} />
                        <Line dataKey="neutral" stroke="var(--color-neutral)" strokeWidth={2} dot={false} />
                        <Line dataKey="negative" stroke="var(--color-negative)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      {/* --- COLUNA 2 --- */}
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Temas Relevantes</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                    {relevantTopics1.map(topic => <li key={topic}>{topic}</li>)}
                </ul>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Análise de Sentimento por Polaridade</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
                    <LineChart data={sentimentPolarityData} margin={{ left: -20, right: 20, top: 10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        <Legend />
                        <Line dataKey="positive" stroke="var(--color-positive)" strokeWidth={2} dot={false} name="Positivo" />
                        <Line dataKey="neutral" stroke="var(--color-neutral)" strokeWidth={2} dot={false} name="Neutro"/>
                        <Line dataKey="negative" stroke="var(--color-negative)" strokeWidth={2} dot={false} name="Negativo"/>
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>

        {/* Redes Sociais removido: depende de integração externa de menções (ex.: Twitter API) */}

      </div>

      {/* --- COLUNA 3 --- */}
      <div className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>Temas Relevantes</CardTitle>
            </CardHeader>
            <CardContent>
                 <ul className="list-disc pl-5 space-y-1">
                    {relevantTopics2.map(topic => <li key={topic}>{topic}</li>)}
                </ul>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Concorrência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-sm font-medium mb-2">Partido</p>
                     <ChartContainer config={barChartConfig} className="h-[100px] w-full">
                        <BarChart data={competitionData.party} margin={{left: -20}}>
                            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        </BarChart>
                    </ChartContainer>
                </div>
                 <div>
                    <p className="text-sm font-medium mb-2">Estado</p>
                    <ChartContainer config={barChartConfig} className="h-[100px] w-full">
                        <BarChart data={competitionData.state} margin={{left: -20}}>
                            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                             <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
