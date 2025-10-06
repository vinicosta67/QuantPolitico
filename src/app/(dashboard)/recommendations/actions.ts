"use server";

import type { RecType, Timeframe, Recommendation, QuickStats } from "@/lib/recommendations-mock";
import { generateRecommendations, getQuickStats } from "@/lib/recommendations-mock";
import { generateRecommendationPlan, type GeneratePlanOutput } from "@/ai/flows/generate-recommendation-plan";

export async function fetchRecommendations({ politician, type, timeframe }: { politician: string; type: RecType; timeframe: Timeframe }) {
  const items: Recommendation[] = generateRecommendations(type, politician, timeframe);
  return items;
}

export async function fetchQuickStats(): Promise<QuickStats> {
  return getQuickStats();
}

export async function generateRecommendationPlanAction(params: {
  politician: string;
  type: RecType;
  timeframe: Timeframe;
  items: Recommendation[];
}): Promise<GeneratePlanOutput> {
  // Proxy to AI flow; keeps client-side code light and consistent with other flows
  return generateRecommendationPlan(params);
}
