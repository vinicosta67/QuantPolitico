"use server";

import {
  getOverviewMock,
  getIndicatorsMock,
  getSentimentTrendMock,
  getVolumeByWeekdayMock,
  getTagsMock,
} from "@/lib/dashboard-mock";

export type DashboardOverview = {
  totalNews: number;
  sentimentAvg: number; // 0..1
  positivePct: number; // %
  confidenceAvg: number; // 0..1
  updatedAtLabel: string; // stable label
};

export type DashboardData = {
  overview: DashboardOverview;
  trend: { month: string; value: number }[];
  volume: { day: string; count: number }[];
  tags: { name: string; count: number }[];
  indicators: { iap: number; ibs: number }[];
};

export async function fetchDashboardData(): Promise<DashboardData> {
  const overview = getOverviewMock();
  const trend = getSentimentTrendMock();
  const volume = getVolumeByWeekdayMock();
  const tags = getTagsMock();
  const indicators = getIndicatorsMock().map((i) => i.indicators);

  return { overview, trend, volume, tags, indicators };
}

