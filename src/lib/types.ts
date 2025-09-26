import type {LucideIcon} from 'lucide-react';
import type {AnalyzePoliticalSentimentOutput} from '@/ai/flows/analyze-political-sentiment';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export type Kpi = {
  label: string;
  value: string;
  description: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
};

export type PolarityData = {
  date: string;
  positive: number;
  negative: number;
};

export type HeatmapData = {
  sector: string;
  sentiment: number;
};

export type ClusterData = {
  name: string;
  value: number;
};

export type RadarData = {
  theme: string;
  value: number;
};

export type BubbleData = {
  name: string;
  relevance: number;
  volume: number;
};

export type EmotionData = {
  emotion: string;
  score: number;
};

export type TrendData = {
  date: string;
  mentions: number;
};

export type Stakeholder = {
  name: string;
  type: string;
  relevance: number;
  stance: 'Apoio' | 'Oposição' | 'Neutro';
};

export type NewsArticle = {
  id: string;
  title: string;
  source: string;
  summary: string;
  imageUrl?: string;
  imageHint?: string;
  publishedAt: string;
  impact?: number;
  url: string;
  sentiment?: AnalyzePoliticalSentimentOutput;
};

export type ImpactData = {
  time: string;
  impact: number;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type Deputy = {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto: string;
};

export type Party = {
  id: number;
  sigla: string;
  nome: string;
};

export type DeputyExpense = {
  ano: number;
  mes: number;
  tipoDespesa: string;
  valorDocumento: number;
};

export type DemographicPoll = {
  label: string;
  value: number;
};

export type IssueImpact = {
  name: string;
  relevance: number;
  impact: number;
};

export type PartyEfficacy = {
  issue: string;
  efficacy: number;
};

export type LocalTheme = {
  theme: string;
  mentions: number;
  party?: string;
};
