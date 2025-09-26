import type { Kpi, PolarityData, HeatmapData, ClusterData, BubbleData, TrendData, Stakeholder, DemographicPoll, IssueImpact, PartyEfficacy, LocalTheme, MonitoredThemeDataPoint } from './types';

export const governmentKpis: Kpi[] = [
  { label: 'Aprovação Presidencial', value: '48%', description: 'Baseado em pesquisas recentes', change: '+1.2', changeType: 'increase' },
  { label: 'Execução Orçamentária', value: '65%', description: 'Percentual do orçamento executado', change: '-3', changeType: 'decrease' },
  { label: 'Risco País', value: '125', description: 'Pontos base (CDS 5 anos)', change: '+5', changeType: 'increase' },
  { label: 'Confiança do Consumidor', value: '92.1', description: 'Índice Nacional (INC)', change: '-0.8', changeType: 'decrease' },
];

export const polarityChartData: PolarityData[] = [
  { date: 'Jan', positive: 55, negative: 45 },
  { date: 'Fev', positive: 58, negative: 42 },
  { date: 'Mar', positive: 62, negative: 38 },
  { date: 'Abr', positive: 59, negative: 41 },
  { date: 'Mai', positive: 63, negative: 37 },
  { date: 'Jun', positive: 61, negative: 39 },
];

export const heatmapData: HeatmapData[] = [
  { sector: 'Agronegócio', sentiment: 0.7 },
  { sector: 'Indústria', sentiment: 0.4 },
  { sector: 'Serviços', sentiment: 0.2 },
  { sector: 'Varejo', sentiment: -0.1 },
  { sector: 'Mercado Financeiro', sentiment: 0.5 },
  { sector: 'Tecnologia', sentiment: 0.6 },
];

export const narrativeClusters: ClusterData[] = [
  { name: 'Reforma Tributária', value: 520 },
  { name: 'Sustentabilidade', value: 380 },
  { name: 'Segurança Digital', value: 290 },
  { name: 'Relações Internacionais', value: 210 },
  { name: 'Emprego e Renda', value: 350 },
];

export const bubbleChartData: BubbleData[] = [
    { name: 'Reforma Tributária', relevance: 92, volume: 520 },
    { name: 'Meio Ambiente', relevance: 85, volume: 380 },
    { name: 'Saúde Pública', relevance: 78, volume: 150 },
    { name: 'Segurança', relevance: 70, volume: 290 },
    { name: 'Emprego', relevance: 88, volume: 410 },
    { name: 'Educação', relevance: 81, volume: 210 },
]

export const emergingTrendsData: TrendData[] = [
    { date: 'Jan', mentions: 150 },
    { date: 'Fev', mentions: 190 },
    { date: 'Mar', mentions: 260 },
    { date: 'Abr', mentions: 310 },
    { date: 'Mai', mentions: 450 },
    { date: 'Jun', mentions: 610 },
];

export const keyStakeholders: Stakeholder[] = [
    { name: 'Ministério da Fazenda', type: 'Governo', relevance: 95, stance: 'Apoio' },
    { name: 'Bancada Ruralista', type: 'Congresso', relevance: 88, stance: 'Neutro' },
    { name: 'Confederação Nacional da Indústria', type: 'Setor Privado', relevance: 82, stance: 'Apoio' },
    { name: 'Sindicatos de Trabalhadores', type: 'Sociedade Civil', relevance: 75, stance: 'Oposição' },
];

export const demographicPollingData: DemographicPoll[] = [
  { label: 'Lula', value: 49 },
  { label: 'Tarcísio', value: 40 },
];

export const issueImpactData: IssueImpact[] = [
  { name: 'Economia', relevance: 85, impact: 9 },
  { name: 'Educação', relevance: 60, impact: 6 },
  { name: 'Saúde', relevance: 70, impact: 8 },
  { name: 'Segurança', relevance: 75, impact: 7 },
];

export const partyEfficacyData: PartyEfficacy[] = [
  { issue: 'Educação', efficacy: 85 },
  { issue: 'Emprego', efficacy: 78 },
  { issue: 'Saúde', efficacy: 65 },
  { issue: 'Governo', efficacy: 55 },
  { issue: 'Segurança', efficacy: 50 },
];

export const localThemesData: LocalTheme[] = [
    { theme: 'Reforma política', mentions: 1577, party: 'MDB' },
    { theme: 'Segurança pública', mentions: 1284, party: 'PL' },
    { theme: 'Infraestrutura', mentions: 964, party: 'UNIÃO' },
    { theme: 'Gastos do governo', mentions: 856, party: 'PCdoB' },
    { theme: 'Meio ambiente', mentions: 789, party: 'PSOL' },
];

export const monitoredThemeExample: MonitoredThemeDataPoint[] = [
  { date: 'D-6', 'Média Móvel': -0.1 },
  { date: 'D-5', 'Média Móvel': -0.15 },
  { date: 'D-4', 'Média Móvel': -0.12 },
  { date: 'D-3', 'Média Móvel': 0.05 },
  { date: 'D-2', 'Média Móvel': 0.1 },
  { date: 'D-1', 'Média Móvel': 0.18 },
  { date: 'Hoje', 'Média Móvel': 0.25 },
];


export const UFs = [ "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO" ];

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

export const politicianData = {
  name: 'Jao Silva',
  status: 'Ativo',
  party: 'ABC',
  popularity: 45,
  approval: 32,
  imageUrl: '/cara-terno1.jpeg', 
};

export const ministerialIndexData = [
  { name: 'Educação', positive: 50, neutral: 25, negative: 25 },
  { name: 'Saúde', positive: 40, neutral: 40, negative: 20 },
  { name: 'Economia', positive: 35, neutral: 35, negative: 30 },
  { name: 'Segurança', positive: 30, neutral: 30, negative: 40 },
];

export const sentimentPolarityData = [
  { month: 'Jan', positive: 62, neutral: 20, negative: 18 },
  { month: 'Fev', positive: 55, neutral: 25, negative: 20 },
  { month: 'Mar', positive: 70, neutral: 15, negative: 15 },
  { month: 'Abr', positive: 65, neutral: 20, negative: 15 },
  { month: 'Mai', positive: 75, neutral: 15, negative: 10 },
  { month: 'Jun', positive: 72, neutral: 18, negative: 10 },
];

export const relevantTopics1 = [
    "Reforma Tributária",
    "Corrupção",
    "Desemprego",
];

export const relevantTopics2 = [
    "Reforma Tributária",
    "Desemprego",
    "Meio Ambiente",
];

export const socialMediaData = [
    { name: 'Educação', impact: 20, reach: 70, type: 'Mídia', color: 'hsl(var(--chart-1))' },
    { name: 'Meio Ambiente', impact: 40, reach: 50, type: 'Alto', color: 'hsl(var(--chart-2))' },
    { name: 'Corrupção', impact: 75, reach: 80, type: 'Baixo', color: 'hsl(var(--chart-3))' },
];

export const competitionData = {
    party: [
        { name: 'A', value: 60 },
        { name: 'B', value: 80 },
        { name: 'C', value: 45 },
        { name: 'D', value: 70 },
    ],
    state: [
        { name: 'SP', value: 50 },
        { name: 'RJ', value: 85 },
        { name: 'MG', value: 70 },
        { name: 'BA', value: 60 },
    ]
};

export const themesRadarData = [
  { name: 'Educação', volume: 40, relevance: 85, fill: 'hsl(var(--chart-2))' },
  { name: 'Corrupção', volume: 70, relevance: 90, fill: 'hsl(var(--muted-foreground))' },
  { name: 'Segurança Pública', volume: 55, relevance: 75, fill: 'hsl(var(--chart-1))' },
  { name: 'Reforma Tributária', volume: 85, relevance: 65, fill: 'hsl(var(--chart-5))' },
  { name: 'Infraestrutura', volume: 20, relevance: 40, fill: 'hsl(var(--chart-3))' },
  { name: 'Meio Ambiente', volume: 60, relevance: 45, fill: 'hsl(var(--destructive))' },
  { name: 'Reforma Política', volume: 30, relevance: 70, fill: 'hsl(var(--chart-4))' },
  { name: 'Saúde', volume: 45, relevance: 25, fill: 'hsl(var(--chart-1))' },
];

export const sentimentProjectionData = [
  { date: 'Jan', positive: 55, negative: 45 },
  { date: 'Fev', positive: 58, negative: 42 },
  { date: 'Mar', positive: 62, negative: 38 },
  { date: 'Abr', positive: 59, negative: 41 },
  { date: 'Mai', positive: 63, negative: 37 },
  { date: 'Jun', positive: 61, negative: 39 },
];

export const narrativeClusterData = [
  { name: 'Desigualdade Social', value: 80 },
  { name: 'Gastos Públicos', value: 45 },
  { name: 'Combate à Pobreza', value: 25 },
];

export const trendDetectionData = [
  { name: 'Saúde Mental', value: 65, color: 'hsl(222.2 47.4% 11.2%)' }, // Azul padrão
  { name: 'Energia Renovável', value: 40, color: 'hsl(142.1 76.2% 36.3%)' }, // Verde
  { name: 'Crime Organizado', value: 20, color: 'hsl(0 84.2% 60.2%)' }, // Vermelho (destructive)
];

export const stakeholderMappingData = [
    { name: 'Notícias', position: 'Apoio', trend: 'up' },
    { name: 'Maria Oliveira', position: 'Oposição', trend: 'stable' },
];