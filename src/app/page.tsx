"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { ArrowRight, LineChart as LineChartIcon, ShieldCheck, Users, Brain, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleTrend = [
  { month: "Jan", value: 45 },
  { month: "Fev", value: 48 },
  { month: "Mar", value: 52 },
  { month: "Abr", value: 50 },
  { month: "Mai", value: 55 },
  { month: "Jun", value: 58 },
];

export default function Home() {
  const chartConfig = useMemo(
    () => ({ value: { label: "Índice", color: "hsl(var(--primary))" } }),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto grid gap-8 px-6 pb-16 pt-20 md:grid-cols-2 md:pb-24 md:pt-28">
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Nova Plataforma</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Inteligência Política em tempo real
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitore narrativas, avalie riscos e antecipe movimentos com análises e visualizações claras.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Acessar Visão Geral <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Entrar</Link>
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Sem instalação extra. Dados de exemplo inclusos.
            </div>
          </div>

          <div className="relative">
            <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-primary" /> Intenção de votos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <LineChart data={sampleTrend}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis hide domain={[40, 60]} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Image
              src="/cara-terno2.jpeg"
              alt="Ilustração"
              width={128}
              height={128}
              className="absolute -right-6 -bottom-6 hidden rounded-xl border shadow-sm md:block"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Tudo que você precisa para decidir</h2>
          <p className="text-muted-foreground mt-2">
            Painéis prontos, análises assistidas por IA e dados públicos integrados.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: LineChartIcon,
              title: "Métricas e Tendências",
              desc: "KPIs, séries históricas e clusters de temas para visão macro.",
            },
            {
              icon: Brain,
              title: "Agente Analista",
              desc: "Pergunte em linguagem natural e obtenha respostas acionáveis.",
            },
            {
              icon: Newspaper,
              title: "Notícias Contextualizadas",
              desc: "Integração com fontes públicas para enriquecer análises.",
            },
            {
              icon: Users,
              title: "Stakeholders",
              desc: "Mapeamento de atores-chave e posicionamentos.",
            },
            {
              icon: ShieldCheck,
              title: "Risco & Crise",
              desc: "Simulações e sinais precoces para resposta rápida.",
            },
            {
              icon: ArrowRight,
              title: "Pronto para uso",
              desc: "Dados mockados e páginas já configuradas.",
            },
          ].map((f, i) => (
            <Card key={i} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <f.icon className="h-5 w-5 text-primary" /> {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-20">
        <div className={cn(
          "flex flex-col items-center justify-between gap-6 rounded-2xl border bg-card p-8 text-center md:flex-row md:text-left",
        )}>
          <div>
            <h3 className="text-2xl font-semibold">Comece agora</h3>
            <p className="text-muted-foreground mt-1">Acesse o dashboard ou entre com uma conta mockada.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/dashboard">Abrir Visão Geral</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
