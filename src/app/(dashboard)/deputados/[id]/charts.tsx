// app/deputados/[id]/charts.tsx
'use client';

import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TimeSeriesData = {
  month: string;
  value: number;
};

type PopularityData = {
    favoravel: number;
    provavel: number;
    desfavoravel: number;
}

export function PopularityChart({ data }: { data: PopularityData }) {
    const chartData = [
        { name: 'Favorável', value: data.favoravel, color: '#2563eb' }, // blue-600
        { name: 'Provável', value: data.provavel, color: '#93c5fd' }, // blue-300
        { name: 'Desfavorável', value: data.desfavoravel, color: '#d1d5db' }, // gray-300
    ];

    return (
        <Card>
            <CardHeader><CardTitle className="text-base font-medium">Popularidade</CardTitle></CardHeader>
            <CardContent>
                <div className="relative h-48 w-full flex flex-col items-center justify-center">
                    {/* O Gráfico */}
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-blue-600">{data.favoravel}%</span>
                        <span className="text-sm text-muted-foreground">Favorável</span>
                    </div>
                </div>
                <div className="flex justify-around text-sm mt-4">
                    <span>🔵 {data.provavel}% Provável</span>
                    <span>⚪ {data.desfavoravel}% Desfavorável</span>
                </div>
            </CardContent>
        </Card>
    )
}


export function ApprovalChart({ data }: { data: TimeSeriesData[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base font-medium">Aprovação</CardTitle></CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
             <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SentimentChart({ data }: { data: TimeSeriesData[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base font-medium">Análise de Sentimento</CardTitle></CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'transparent'}} />
            <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}