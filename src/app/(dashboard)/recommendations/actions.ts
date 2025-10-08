"use server";

import type { RecType, Timeframe, Recommendation, QuickStats } from "@/lib/recommendations-mock";
import { generateRecommendations, getQuickStats } from "@/lib/recommendations-mock";
import { generateRecommendationPlan, type GeneratePlanOutput } from "@/ai/flows/generate-recommendation-plan";
import { fetchOnlinePoliticalNews } from "@/ai/tools/fetch-online-news";
import { fetchOnlinePoliticalNewsStatus } from "@/ai/tools/fetch-online-news-status";
import { fetchPoliticalNews } from "@/ai/tools/fetch-news";

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

// Types for news preview UI
export type NewsArticle = { title: string; source: string; url: string; summary: string; publishedAt: string };
export type NewsGroup = { query: string; ok: boolean; provider: string; items: NewsArticle[]; error?: string };

function timeframeToDays(tf: Timeframe): number {
  if (tf === "day") return 1;
  if (tf === "week") return 7;
  // cap at 14 (GDELT timespan limit we use)
  return 14;
}

export async function fetchPlanNewsAction(params: {
  politician: string;
  timeframe: Timeframe;
  competitors?: string[];
}): Promise<NewsGroup[]> {
  const days = timeframeToDays(params.timeframe);
  // Base list of candidates visible/used in the Recommendations tab UI
  const DEFAULT_CANDIDATES = [
    'Lula',
    'Bolsonaro',
    'Tarcísio',
    'Boulos',
  ];

  // Merge: selected politician + competitors from the generated plan + other candidates from the tab
  const queries = Array.from(
    new Set(
      [
        params.politician,
        ...(params.competitors ?? []),
        ...DEFAULT_CANDIDATES.filter((c) => c !== params.politician),
      ]
        .map((s) => (s || '').trim())
        .filter(Boolean)
    )
  );
  const results: NewsGroup[] = [];
  for (const q of queries) {
    try {
      const res = await fetchOnlinePoliticalNewsStatus({ query: q, days });
      if (res.ok && res.items.length) {
        results.push({ query: q, ok: true, provider: res.provider, items: res.items.slice(0, 10) });
        continue;
      }
      const alt = await fetchOnlinePoliticalNews({ query: q, days });
      const items = Array.isArray(alt) ? alt : [];
      if (items.length) {
        results.push({ query: q, ok: true, provider: "gdelt", items: items.slice(0, 10) });
      } else {
        const mock = await fetchPoliticalNews({ query: q });
        results.push({ query: q, ok: mock.length > 0, provider: "mock", items: mock.slice(0, 10) as any });
      }
    } catch (e: any) {
      results.push({ query: q, ok: false, provider: "gdelt", items: [], error: e?.message || "unknown_error" });
    }
  }
  return results;
}
