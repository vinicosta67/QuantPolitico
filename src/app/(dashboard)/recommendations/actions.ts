"use server";

import type { RecType, Timeframe, Recommendation, QuickStats } from "@/lib/recommendations-mock";
import { generateRecommendations, getQuickStats } from "@/lib/recommendations-mock";

export async function fetchRecommendations({ politician, type, timeframe }: { politician: string; type: RecType; timeframe: Timeframe }) {
  const items: Recommendation[] = generateRecommendations(type, politician, timeframe);
  return items;
}

export async function fetchQuickStats(): Promise<QuickStats> {
  return getQuickStats();
}

