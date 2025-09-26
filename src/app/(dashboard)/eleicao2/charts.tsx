'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';

// --- Componente para os KPIs (IAp e IApP) ---
export function KpiCard({ title, subtitle, value }: { title: string, subtitle: string, value: number }) {
  // Dados falsos para o minigráfico (sparkline)
  const chartData = [
    { v: Math.random() * 10 }, { v: Math.random() * 10 + 10 },
    { v: Math.random() * 10 + 5 }, { v: Math.random() * 10 + 20 },
    { v: Math.random() * 10 + 15 }, { v: Math.random() * 10 + 30 },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <div className="text-5xl font-light mb-2">{value}%</div>
        <div className="h-12 -mx-6 -mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="kpiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#kpiGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Gráfico de Medidor (Gauge) para o ITS ---
export function GaugeChart({ value, change }: { value: number, change: number }) {
  // O ângulo da seta, de -90 (esquerda) a +90 (direita)
  const angle = value * 180 - 90;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">ITS</CardTitle>
        <p className="text-xs text-muted-foreground">(Transferibilidade de Votos)</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="text-5xl font-light">{value.toFixed(2).replace('.', ',')}</div>
        <div className="flex items-center text-red-500 font-semibold text-sm">
          <ArrowUp className="h-4 w-4 mr-1" /> {change.toFixed(2).replace('.', ',')}
        </div>
        <div className="relative w-48 h-24 mt-2 overflow-hidden">
          {/* Fundo cinza do medidor */}
          <div className="absolute top-0 left-0 w-full h-full border-[12px] border-gray-200 rounded-t-full border-b-0"></div>
          {/* Progresso vermelho do medidor */}
          <div
            className="absolute top-0 left-0 w-full h-full border-[12px] border-red-500 rounded-t-full border-b-0 transition-transform duration-500"
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              transform: `rotate(${value * 180}deg)`,
              transformOrigin: 'bottom center',
            }}
          ></div>
          {/* Seta */}
          <div
            className="absolute bottom-0 left-1/2 w-1 h-16 bg-gray-700 origin-bottom transition-transform duration-500 -ml-0.5"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Gráfico de Radar para Mapa de Temas ---
export function RadarChartComponent({ data }: { data: { tema: string, valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="tema" tick={{ fontSize: 12 }} />
        <Radar dataKey="valor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
}