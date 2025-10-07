import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { GeneratePlanOutput } from '@/ai/flows/generate-recommendation-plan';

export type PlanPdfMeta = {
  politician: string;
  type: string;
  timeframe: string;
};

const PAGE = { width: 595, height: 842, margin: 48 } as const; // A4 portrait
const GAP = { line: 14, block: 18, section: 26 } as const;

// Theme based on src/app/globals.css (Teal + Gold)
function hslToRgb01(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs(((hp % 2) - 1)));
  let r = 0, g = 0, b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [r, g, b] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [r, g, b] = [0, c, x];
  else if (hp >= 3 && hp < 4) [r, g, b] = [0, x, c];
  else if (hp >= 4 && hp < 5) [r, g, b] = [x, 0, c];
  else if (hp >= 5 && hp < 6) [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}
const colorFromHsl = (h: number, s: number, l: number) => {
  const [r, g, b] = hslToRgb01(h, s, l);
  return rgb(r, g, b);
};
const THEME = {
  primary: colorFromHsl(180, 1, 0.25), // Deep Teal
  accent: colorFromHsl(45, 0.74, 0.52), // Vibrant Gold
  text: rgb(0.1, 0.1, 0.1),
  muted: rgb(0.35, 0.35, 0.35),
  border: rgb(0.85, 0.85, 0.85),
  soft: rgb(0.95, 0.98, 0.98),
  red: rgb(0.84, 0.26, 0.24),
  amber: rgb(0.96, 0.62, 0.04),
  teal: rgb(0, 0.5, 0.5),
};

function wrapByWidth(font: any, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    const width = font.widthOfTextAtSize(trial, size);
    if (width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function addHeader(page: any, title: string, meta: PlanPdfMeta, fontRegular: any, fontBold: any) {
  const { width, height, margin } = PAGE;
  // Top bar
  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: THEME.primary });
  page.drawRectangle({ x: 0, y: height - 38, width, height: 2, color: THEME.accent });
  // Brand
  page.drawText('Quant Politico', { x: margin, y: height - 26, size: 11, font: fontBold, color: rgb(1, 1, 1) });

  // Title
  const maxW = width - margin * 2;
  const titleLines = wrapByWidth(fontBold, title, 20, maxW);
  let ty = height - margin - 10 - 12;
  for (const tl of titleLines) {
    page.drawText(tl, { x: margin, y: ty, size: 20, font: fontBold, color: THEME.text });
    ty -= 22;
  }

  // Chips row (meta)
  const chips = [
    { label: `PolÃ­tico: ${meta.politician}` },
    { label: `Aba: ${meta.type}` },
    { label: `PerÃ­odo: ${meta.timeframe}` },
  ];
  let cx = margin; const cy = ty - 10;
  for (const c of chips) {
    const padX = 6; const padY = 3;
    const w = (c.label.length * 5.2) + padX * 2; // rough measure
    page.drawRectangle({ x: cx, y: cy, width: w, height: 16, color: THEME.soft, borderWidth: 1, borderColor: THEME.border });
    page.drawText(c.label, { x: cx + padX, y: cy + padY, size: 9, font: fontRegular, color: THEME.muted });
    cx += w + 8;
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + (current ? ' ' : '') + w).length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSectionTitle(page: any, y: number, text: string, font: any) {
  // Accent marker
  page.drawRectangle({ x: PAGE.margin - 4, y: y - 2, width: 3, height: 14, color: THEME.accent });
  page.drawText(text, { x: PAGE.margin + 4, y, size: 12, font, color: THEME.text });
  return y - GAP.section;
}

function ensureSpace(doc: PDFDocument, page: any, y: number, needed: number, fontRegular: any, fontBold: any, title: string, meta: PlanPdfMeta) {
  if (y - needed < PAGE.margin) {
    const p = doc.addPage([PAGE.width, PAGE.height]);
    addHeader(p, title, meta, fontRegular, fontBold);
    return { page: p, y: PAGE.height - PAGE.margin - 72 };
  }
  return { page, y };
}

export async function planToPdfBytes(plan: GeneratePlanOutput, meta: PlanPdfMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const firstPage = doc.addPage([PAGE.width, PAGE.height]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
  addHeader(firstPage, plan.title, meta, font, fontBold);
  let page = firstPage; // current drawing page
  let y = PAGE.height - PAGE.margin - 78; // extra space for chips

  const italicWords = [
    'workshop', 'podcast', 'briefing', 'benchmark', 'benchmarking', 'stakeholder', 'stakeholders',
    'roadmap', 'sprint', 'sprints', 'playbook', 'newsletter', 'youtube', 'tiktok', 'linkedin',
    'twitter', 'instagram', 'reels', 'shorts', 'threads'
  ];

  const drawTextMixed = (p: any, x: number, yy: number, text: string, size = 10, color = THEME.text) => {
    const tokens = text.split(/(\s+)/);
    let cx = x;
    for (const t of tokens) {
      const low = t.toLowerCase();
      const useItalic = italicWords.includes(low.replace(/[^a-z]/g, ''));
      const f = useItalic ? fontItalic : font;
      p.drawText(t, { x: cx, y: yy, size, font: f, color });
      const w = f.widthOfTextAtSize ? f.widthOfTextAtSize(t, size) : t.length * size * 0.5;
      cx += w;
    }
  };

  // Summary
  { const r = ensureSpace(doc, page, y, 70, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
  y = drawSectionTitle(page, y, 'Resumo Executivo', fontBold);
  const summaryLines = wrapText(plan.summary, 100);
  for (const line of summaryLines) {
    { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    drawTextMixed(page, PAGE.margin, y, line, 10, THEME.text);
    y -= GAP.line;
  }
  y -= GAP.block;

  // Objectives
  y = drawSectionTitle(page, y, 'Objetivos (KPIs)', fontBold);
  for (const obj of plan.objectives) {
    { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    const lines = wrapText(`â€¢ ${obj}`, 100);
    for (const l of lines) {
      drawTextMixed(page, PAGE.margin, y, l, 10, THEME.text);
      y -= GAP.line;
    }
  }
  y -= GAP.section;

  // Competitive strategies (optional)
  const comp: any[] | undefined = (plan as any).competitiveStrategies;
  if (Array.isArray(comp) && comp.length > 0) {
    y = drawSectionTitle(page, y, 'EstratÃ©gia Competitiva (com base nas notÃ­cias)', fontBold);
    for (const c of comp) {
      { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      page.drawText(`â€¢ ${c.competitor || 'Concorrente'}`, { x: PAGE.margin, y, size: 11, font: fontBold, color: THEME.text });
      y -= GAP.line;
      if (Array.isArray(c.insights) && c.insights.length) {
        const lns = c.insights.flatMap((s: string) => wrapText(`- ${s}`, 95));
        for (const l of lns) { drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.muted); y -= GAP.line; }
      }
      if (Array.isArray(c.recommended) && c.recommended.length) {
        const lns = c.recommended.flatMap((s: string) => wrapText(`- ${s}`, 95));
        for (const l of lns) { drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.text); y -= GAP.line; }
      }
      y -= GAP.block;
    }
  }

  // Actions
  y = drawSectionTitle(page, y, 'AÃ§Ãµes Recomendadas', fontBold);
  for (const a of plan.actions) {
    { const r = ensureSpace(doc, page, y, 36, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    // Title line with accent underline
    page.drawText(`â€¢ ${a.title}`, { x: PAGE.margin, y, size: 11, font: fontBold, color: THEME.text });
    page.drawLine({ start: { x: PAGE.margin, y: y - 3 }, end: { x: PAGE.width - PAGE.margin, y: y - 3 }, thickness: 0.5, color: THEME.border });
    y -= GAP.line;
    const stepLines = a.steps.flatMap(s => wrapText(`- ${s}`, 95));
    for (const l of stepLines) {
      { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.muted);
      y -= GAP.line;
    }
    if (a.owners?.length) {
      const ownersLine = wrapText(`ResponsÃ¡veis: ${a.owners.join(', ')}`, 100);
      for (const l of ownersLine) { drawTextMixed(page, PAGE.margin + 12, y, l, 9, THEME.accent); y -= GAP.line; }
    }
    if (a.kpis?.length) {
      const kLine = wrapText(`KPIs: ${a.kpis.join(', ')}`, 100);
      for (const l of kLine) { drawTextMixed(page, PAGE.margin + 12, y, l, 9, THEME.accent); y -= GAP.line; }
    }
    y -= GAP.block;
  }

  // Timeline
  y = drawSectionTitle(page, y, 'Cronograma', fontBold);
  for (const t of plan.timeline) {
    { const r = ensureSpace(doc, page, y, 26, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    // Bullet circle marker
    page.drawRectangle({ x: PAGE.margin - 2, y: y - 2, width: 4, height: 4, color: THEME.primary });
    page.drawText(`${t.label}`, { x: PAGE.margin + 6, y, size: 11, font: fontBold, color: THEME.text });
    y -= GAP.line;
    for (const d of t.deliverables) {
      { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      const lns = wrapText(`- ${d}`, 95);
      for (const l of lns) { drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.muted); y -= GAP.line; }
    }
  }
  y -= GAP.section;

  // Risks
  y = drawSectionTitle(page, y, 'Riscos & MitigaÃ§Ãµes', fontBold);
  for (const r of plan.risks) {
    { const rr = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = rr.page; y = rr.y; }
    const lns = wrapText(`â€¢ ${r}`, 100);
    for (const l of lns) { drawTextMixed(page, PAGE.margin, y, l, 10, THEME.text); y -= GAP.line; }
  }
  y -= GAP.section;
  // Monitoring
  y = drawSectionTitle(page, y, 'Monitoramento & PrÃ³ximos Passos', fontBold);
  for (const m of plan.monitoring) {
    { const rr = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = rr.page; y = rr.y; }
    const lns = wrapText(`â€¢ ${m}`, 100);
    for (const l of lns) { drawTextMixed(page, PAGE.margin, y, l, 10, THEME.text); y -= GAP.line; }
  }

  // Footer with page numbers and brand
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    const yb = 28;
    p.drawLine({ start: { x: PAGE.margin, y: yb + 8 }, end: { x: PAGE.width - PAGE.margin, y: yb + 8 }, thickness: 0.5, color: THEME.border });
    p.drawText(`Quant Politico â€” InteligÃªncia Eleitoral`, { x: PAGE.margin, y: yb, size: 9, font, color: THEME.muted });
    const label = `PÃ¡gina ${idx + 1} de ${pages.length}`;
    const approx = label.length * 5;
    p.drawText(label, { x: PAGE.width - PAGE.margin - approx, y: yb, size: 9, font, color: THEME.muted });
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
}

