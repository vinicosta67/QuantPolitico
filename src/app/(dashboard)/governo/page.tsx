"use client"

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Loader2, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Legend, Tooltip } from "recharts";
import { useDebounce } from "use-debounce";

import {
  politicianData as defaultPolitician,
  ministerialIndexData as defaultMinisterial,
  sentimentPolarityData as defaultSentiment,
  relevantTopics1 as defaultTopics1,
  relevantTopics2 as defaultTopics2,
  competitionData as defaultCompetition,
} from "@/lib/data";
import { searchGovernmentPolitician } from "./actions";
import { searchDeputies } from "@/app/(dashboard)/deputados/actions";
import type { Deputy } from "@/lib/types";

const lineChartConfig = {
  positive: { label: "Positivo", color: "hsl(var(--chart-2))" },
  neutral: { label: "Neutro", color: "hsl(var(--muted-foreground))" },
  negative: { label: "Negativo", color: "hsl(var(--destructive))" },
};

const barChartConfig = {
  value: { label: "Valor", color: "hsl(var(--primary))" },
};

type PageData = {
  politician: typeof defaultPolitician;
  relevantTopics1: string[];
  relevantTopics2: string[];
  ministerialIndexData: typeof defaultMinisterial;
  sentimentPolarityData: typeof defaultSentiment;
  competitionData: typeof defaultCompetition;
};

export default function GovernoPage() {
  const [query, setQuery] = React.useState("");
  const [debounced] = useDebounce(query, 500);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Deputy[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const searchBoxRef = React.useRef<HTMLDivElement>(null);
  const [data, setData] = React.useState<PageData>({
    politician: defaultPolitician,
    relevantTopics1: defaultTopics1,
    relevantTopics2: defaultTopics2,
    ministerialIndexData: defaultMinisterial,
    sentimentPolarityData: defaultSentiment,
    competitionData: defaultCompetition,
  });

  // Buscar sugestões de deputados ao digitar (não aplica os dados ainda)
  React.useEffect(() => {
    const name = debounced.trim();
    if (name.length >= 3) {
      (async () => {
        try {
          setIsLoading(true);
          const list = await searchDeputies({ name });
          setSuggestions(list);
          setShowDropdown(true);
          setHasSearched(true);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      setHasSearched(false);
    }
  }, [debounced]);

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applySelection = React.useCallback(async (dep: Deputy | { nome: string; urlFoto?: string; siglaPartido?: string }) => {
    try {
      setIsLoading(true);
      setShowDropdown(false);
      const result = await searchGovernmentPolitician(dep.nome);
      setQuery(dep.nome);
      setData({
        politician: {
          ...(result.politician as any),
          name: dep.nome,
          party: dep.siglaPartido || (result.politician as any).party,
          imageUrl: dep.urlFoto || (result.politician as any).imageUrl,
        },
        relevantTopics1: result.relevantTopics1,
        relevantTopics2: result.relevantTopics2,
        ministerialIndexData: result.ministerialIndexData as any,
        sentimentPolarityData: result.sentimentPolarityData as any,
        competitionData: result.competitionData as any,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Coluna Esquerda */}
      <div className="lg:col-span-4 space-y-6">
        <Card>
          <CardHeader className="p-4">
            <div className="relative" ref={searchBoxRef} onFocus={() => setShowDropdown(true)}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do político (mín. 3 letras)"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (suggestions.length > 0) {
                      applySelection(suggestions[0]);
                    } else {
                      // Sem resultados: apenas mantém dropdown aberto e exibe mensagem
                      setShowDropdown(true);
                    }
                  }
                }}
              />
              {isLoading && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!isLoading && query.trim().length > 0 && (
                <button
                  type="button"
                  aria-label="Limpar"
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    setShowDropdown(false);
                    setHasSearched(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {showDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md max-h-64 overflow-auto">
                  {isLoading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Carregando...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((dep) => (
                      <button
                        key={dep.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground text-left"
                        onMouseDown={(e)=> e.preventDefault()}
                        onClick={() => applySelection(dep)}
                      >
                        <Image src={dep.urlFoto} alt={dep.nome} width={28} height={28} className="rounded-full" />
                        <span className="flex-1">
                          <span className="font-medium">{dep.nome}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{dep.siglaPartido} - {dep.siglaUf}</span>
                        </span>
                      </button>
                    ))
                  ) : hasSearched ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum político encontrado</div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Digite ao menos 3 letras</div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Image
              src={data.politician.imageUrl}
              alt={`Foto de ${data.politician.name}`}
              width={96}
              height={96}
              className="rounded-full mb-2"
            />
            <div className="text-base font-semibold mb-3">{data.politician.name}</div>

            <div className="grid grid-cols-2 gap-4 w-full text-left text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Situação</p>
                <p className="font-semibold">{data.politician.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Partido</p>
                <p className="font-semibold">{data.politician.party}</p>
              </div>
            </div>

            <div className="w-full space-y-3 text-left">
              <div>
                <div className="flex justify-between mb-1 text-sm font-medium">
                  <span>Popularidade</span>
                  <span>{data.politician.popularity}%</span>
                </div>
                <Progress value={data.politician.popularity} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm font-medium">
                  <span>Aprovação</span>
                  <span>{data.politician.approval}%</span>
                </div>
                <Progress value={data.politician.approval} className="h-2 [&>div]:bg-destructive" />
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
              className="h-[260px] w-full"
            >
              <BarChart layout="vertical" data={data.ministerialIndexData as any} barCategoryGap={12}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={90} />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any, name?: any) => (
                        <div className="flex w-full justify-between">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono">{Number(value).toFixed(0)}%</span>
                        </div>
                      )}
                    />
                  }
                />
                <Legend />
                <Bar dataKey="positive" fill="hsl(var(--chart-2))" stackId="a" radius={[4, 0, 0, 4]} />
                <Bar dataKey="neutral" fill="hsl(var(--muted))" stackId="a" />
                <Bar dataKey="negative" fill="hsl(var(--destructive))" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Área Direita: 2 colunas, cards lado a lado e blocos maiores ocupando tudo */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Temas Relevantes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {data.relevantTopics1.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temas Relevantes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {data.relevantTopics2.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Análise de Sentimento por Polaridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineChartConfig} className="h-[380px] w-full">
              <LineChart data={data.sentimentPolarityData as any} margin={{ left: -20, right: 20, top: 10 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Legend />
                <Line dataKey="positive" stroke="var(--color-positive)" strokeWidth={2} dot={false} name="Positivo" />
                <Line dataKey="neutral" stroke="var(--color-neutral)" strokeWidth={2} dot={false} name="Neutro" />
                <Line dataKey="negative" stroke="var(--color-negative)" strokeWidth={2} dot={false} name="Negativo" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

       
      </div>
    </div>
  );
}
