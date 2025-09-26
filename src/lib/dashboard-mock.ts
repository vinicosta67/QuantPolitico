type SeedFn = () => number;

function seeded(seedStr: string): SeedFn {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 0xffffffff);
}

function range(rnd: SeedFn, min: number, max: number, d = 2) {
  return parseFloat((min + rnd() * (max - min)).toFixed(d));
}

export function getOverviewMock() {
  const rnd = seeded('dashboard|overview');
  const totalNews = Math.floor(200 + rnd() * 400);
  const sentimentAvg = range(rnd, 0.4, 0.8, 2);
  const positivePct = range(rnd, 50, 80, 1);
  const confidenceAvg = range(rnd, 0.75, 0.95, 2);
  const updatedAtLabel = '2024-06-01 12:00';
  return { totalNews, sentimentAvg, positivePct, confidenceAvg, updatedAtLabel };
}

export function getIndicatorsMock(count = 18) {
  const rnd = seeded('dashboard|indicators');
  return Array.from({ length: count }).map((_, i) => ({
    id: i + 1,
    indicators: {
      iap: range(rnd, 0.3, 0.8, 3),
      ibs: range(rnd, 0.2, 0.9, 3),
    },
  }));
}

export function getSentimentTrendMock() {
  const rnd = seeded('dashboard|sentiment');
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  return labels.map((label) => ({ month: label, value: range(rnd, 0.55, 0.78, 2) }));
}

export function getVolumeByWeekdayMock() {
  const rnd = seeded('dashboard|volume');
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  return labels.map((day) => ({ day, count: Math.floor(25 + rnd() * 60) }));
}

export function getTagsMock() {
  return [
    { name: 'Segurança', count: 15 },
    { name: 'Justiça', count: 23 },
    { name: 'Eleições', count: 8 },
  ];
}

