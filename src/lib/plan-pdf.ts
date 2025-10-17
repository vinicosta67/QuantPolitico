import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { GeneratePlanOutput } from '@/ai/flows/generate-recommendation-plan';

export type PlanPdfMeta = {
  politician: string;
  type: string;
  timeframe: string;
};

const PAGE = { width: 595, height: 842, margin: 48 } as const; // A4 portrait
// Tuned gaps for better readability
const GAP = { line: 16, block: 22, section: 30 } as const;

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

// Replace Unicode punctuation not supported by WinAnsi with ASCII-safe equivalents
function sanitizeWinAnsi(text: string): string {
  if (!text) return '';
  let out = text
    // hyphen/dash variants → '-'
    .replace(/[\u2010-\u2015]/g, '-')
    // curly quotes → ' and "
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // bullets → '*'
    .replace(/[\u2022\u2023\u25E6]/g, '*')
    // ellipsis → '...'
    .replace(/\u2026/g, '...')
    // non-breaking spaces → regular space
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    // general punctuation & bidi marks → space
    .replace(/[\u2000-\u206F]/g, ' ')
    // remove any character outside Latin-1 (WinAnsi)
    .replace(/[^\u0000-\u00FF]/g, '');
  return out;
}

function wrapByWidth(font: any, text: string, size: number, maxWidth: number): string[] {
  const clean = sanitizeWinAnsi(text);
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    const width = font.widthOfTextAtSize(sanitizeWinAnsi(trial), size);
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

// Dynamic header that returns starting Y for body content
function addHeaderDynamic(page: any, title: string, meta: PlanPdfMeta, fontRegular: any, fontBold: any): number {
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
    page.drawText(sanitizeWinAnsi(tl), { x: margin, y: ty, size: 20, font: fontBold, color: THEME.text });
    ty -= 22;
  }

  // Chips row (meta)
  const chips = [
    { label: `Político: ${meta.politician}` },
    { label: `Aba: ${meta.type}` },
    { label: `Período: ${meta.timeframe}` },
  ];
  let cx = margin; const cy = ty - 10;
  for (const c of chips) {
    const label = sanitizeWinAnsi(c.label);
    const padX = 6; const padY = 3;
    const w = (fontRegular.widthOfTextAtSize ? fontRegular.widthOfTextAtSize(label, 9) : (label.length * 5.2)) + padX * 2;
    page.drawRectangle({ x: cx, y: cy, width: w, height: 16, color: THEME.soft, borderWidth: 1, borderColor: THEME.border });
    page.drawText(label, { x: cx + padX, y: cy + padY, size: 9, font: fontRegular, color: THEME.muted });
    cx += w + 8;
  }
  return cy - 24; // extra breathing space before body
}

function drawSectionTitle(page: any, y: number, text: string, font: any) {
  // Accent marker
  page.drawRectangle({ x: PAGE.margin - 4, y: y - 2, width: 3, height: 14, color: THEME.accent });
  page.drawText(sanitizeWinAnsi(text), { x: PAGE.margin + 4, y, size: 12, font, color: THEME.text });
  return y - GAP.section;
}

function ensureSpace(doc: PDFDocument, page: any, y: number, needed: number, fontRegular: any, fontBold: any, title: string, meta: PlanPdfMeta) {
  if (y - needed < PAGE.margin) {
    const p = doc.addPage([PAGE.width, PAGE.height]);
    const yStart = addHeaderDynamic(p, title, meta, fontRegular, fontBold);
    return { page: p, y: yStart };
  }
  return { page, y };
}

export async function planToPdfBytes(plan: GeneratePlanOutput, meta: PlanPdfMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const firstPage = doc.addPage([PAGE.width, PAGE.height]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const yStart = addHeaderDynamic(firstPage, plan.title, meta, font, fontBold);
  let page = firstPage; // current drawing page
  let y = yStart; // start below header (dynamic)

  const italicWords = [
    'workshop', 'podcast', 'briefing', 'benchmark', 'benchmarking', 'stakeholder', 'stakeholders',
    'roadmap', 'sprint', 'sprints', 'playbook', 'newsletter', 'youtube', 'tiktok', 'linkedin',
    'twitter', 'instagram', 'reels', 'shorts', 'threads'
  ];

  const drawTextMixed = (p: any, x: number, yy: number, text: string, size = 10, color = THEME.text) => {
    const tokens = sanitizeWinAnsi(text).split(/(\s+)/);
    let cx = x;
    for (const t of tokens) {
      const low = t.toLowerCase();
      const useItalic = italicWords.includes(low.replace(/[^a-z]/g, ''));
      const f = useItalic ? fontItalic : font;
      const safe = sanitizeWinAnsi(t);
      p.drawText(safe, { x: cx, y: yy, size, font: f, color });
      const w = f.widthOfTextAtSize ? f.widthOfTextAtSize(safe, size) : safe.length * size * 0.5;
      cx += w;
    }
  };

  // 0) Narrative cover + sections (if present)
  const narrative: any | undefined = (plan as any).narrative;
  if (narrative) {
    // Cover headline
    { const r = ensureSpace(doc, page, y, 90, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    const headLines = wrapByWidth(fontBold, narrative.headline || '', 24, PAGE.width - PAGE.margin * 2);
    for (const hl of headLines) { page.drawText(sanitizeWinAnsi(hl), { x: PAGE.margin, y, size: 24, font: fontBold, color: THEME.text }); y -= 26; }
    if (narrative.subheadline) {
      const sub = wrapByWidth(font, narrative.subheadline, 13, PAGE.width - PAGE.margin * 2);
      for (const l of sub) { page.drawText(sanitizeWinAnsi(l), { x: PAGE.margin, y, size: 13, font, color: THEME.muted }); y -= 16; }
    }
    if (narrative.date) {
      page.drawText(sanitizeWinAnsi(String(narrative.date)), { x: PAGE.margin, y, size: 10, font, color: THEME.muted });
      y -= GAP.line;
    }
    // Lede
    if (narrative.lede) {
      const ledeLines = wrapByWidth(font, narrative.lede, 11, PAGE.width - PAGE.margin * 2);
      y -= 10;
      for (const l of ledeLines) { drawTextMixed(page, PAGE.margin, y, l, 11, THEME.text); y -= GAP.line; }
      y -= GAP.block;
    }
    // Optional callout
    if (narrative.callout) {
      const boxH = 60; const boxW = PAGE.width - PAGE.margin * 2;
      { const r = ensureSpace(doc, page, y, boxH + 10, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      page.drawRectangle({ x: PAGE.margin, y: y - boxH, width: boxW, height: boxH, color: THEME.soft, borderColor: THEME.border, borderWidth: 1 });
      const callLines = wrapByWidth(fontItalic, narrative.callout, 11, boxW - 16);
      let cy = y - 18;
      for (const cl of callLines) { page.drawText(cl, { x: PAGE.margin + 8, y: cy, size: 11, font: fontItalic, color: THEME.text }); cy -= 14; }
      y -= (boxH + GAP.block);
    }

    // Narrative sections
    if (Array.isArray(narrative.sections)) {
      for (const sec of narrative.sections) {
        { const r = ensureSpace(doc, page, y, 40, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
        // Section heading with underline
        const hLines = wrapByWidth(fontBold, sec.heading || 'Seção', 14, PAGE.width - PAGE.margin * 2);
        for (const h of hLines) { page.drawText(sanitizeWinAnsi(h), { x: PAGE.margin, y, size: 14, font: fontBold, color: THEME.text }); y -= 16; }
        page.drawLine({ start: { x: PAGE.margin, y: y + 4 }, end: { x: PAGE.width - PAGE.margin, y: y + 4 }, thickness: 0.5, color: THEME.border });
        y -= 10;
        const paras: string[] = Array.isArray(sec.paragraphs) ? sec.paragraphs : [];
        for (const pTxt of paras) {
          const pLines = wrapByWidth(font, pTxt, 10.5, PAGE.width - PAGE.margin * 2);
          for (const l of pLines) { { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; } drawTextMixed(page, PAGE.margin, y, l, 10.5, THEME.text); y -= GAP.line; }
          y -= 4;
        }
        // keyStats bullets
        if (Array.isArray(sec.keyStats) && sec.keyStats.length) {
          for (const s of sec.keyStats) { const sLines = wrapByWidth(font, `• ${s}`, 10, PAGE.width - PAGE.margin * 2); for (const l of sLines) { drawTextMixed(page, PAGE.margin, y, l, 10, THEME.muted); y -= GAP.line; } }
          y -= 4;
        }
        // quote callout
        if (sec.quote?.text) {
          const text = sec.quote.text + (sec.quote.attribution ? ` - ${sec.quote.attribution}` : '');
          const qH = 50; const qW = PAGE.width - PAGE.margin * 2;
          { const r = ensureSpace(doc, page, y, qH + 8, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
          page.drawRectangle({ x: PAGE.margin, y: y - qH, width: qW, height: qH, color: THEME.soft, borderColor: THEME.border, borderWidth: 1 });
          const qLines = wrapByWidth(fontItalic, `"${text}"`, 11, qW - 16);
          let qy = y - 18; for (const ql of qLines) { page.drawText(ql, { x: PAGE.margin + 8, y: qy, size: 11, font: fontItalic, color: THEME.text }); qy -= 14; }
          y -= (qH + GAP.block);
        }
        y -= 4;
      }
    }

    // Sources list
    if (Array.isArray(narrative.sources) && narrative.sources.length) {
      y = drawSectionTitle(page, y, 'Fontes', fontBold);
      for (const s of narrative.sources) {
        const label = `${s.title}${s.publishedAt ? ' — ' + s.publishedAt : ''}`;
        const lns = wrapByWidth(font, `• ${label}`, 10, PAGE.width - PAGE.margin * 2);
        for (const l of lns) { drawTextMixed(page, PAGE.margin, y, l, 10, THEME.muted); y -= GAP.line; }
      }
      y -= GAP.section;
    }

    // Start a new page for the action plan to keep layout clean
    const newp = doc.addPage([PAGE.width, PAGE.height]);
    const y2 = addHeaderDynamic(newp, plan.title, meta, font, fontBold);
    page = newp; y = y2; // reset body start below header
  } else {
    // Summary fallback when narrative is absent
    { const r = ensureSpace(doc, page, y, 70, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    y = drawSectionTitle(page, y, 'Resumo Executivo', fontBold);
    const summaryLines = wrapByWidth(font, plan.summary, 10, PAGE.width - PAGE.margin * 2);
    for (const line of summaryLines) {
      { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      drawTextMixed(page, PAGE.margin, y, line, 10, THEME.text);
      y -= GAP.line;
    }
    y -= GAP.block;
  }

  // 1) Plan objectives
  y = drawSectionTitle(page, y, 'Objetivos (KPIs)', fontBold);
  for (const obj of plan.objectives) {
    { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    const lines = wrapByWidth(font, `• ${obj}`, 10, PAGE.width - PAGE.margin * 2);
    for (const l of lines) {
      drawTextMixed(page, PAGE.margin, y, l, 10, THEME.text);
      y -= GAP.line;
    }
    y -= 4;
  }
  y -= GAP.section;

  // 2) Competitive strategies (optional)
  const comp: any[] | undefined = (plan as any).competitiveStrategies;
  if (Array.isArray(comp) && comp.length > 0) {
    y = drawSectionTitle(page, y, 'Estratégia Competitiva (com base nas notícias)', fontBold);
    for (const c of comp) {
      { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      page.drawText(`• ${c.competitor || 'Concorrente'}`, { x: PAGE.margin, y, size: 11, font: fontBold, color: THEME.text });
      y -= GAP.line;
      if (Array.isArray(c.insights) && c.insights.length) {
        const lns = c.insights.flatMap((s: string) => wrapByWidth(font, `- ${s}`, 10, PAGE.width - PAGE.margin * 2 - 12));
        for (const l of lns) { drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.muted); y -= GAP.line; }
      }
      if (Array.isArray(c.recommended) && c.recommended.length) {
        const lns = c.recommended.flatMap((s: string) => wrapByWidth(font, `- ${s}`, 10, PAGE.width - PAGE.margin * 2 - 12));
        for (const l of lns) { drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.text); y -= GAP.line; }
      }
      y -= GAP.block;
    }
  }

  // 3) Actions
  y = drawSectionTitle(page, y, 'Ações Recomendadas', fontBold);
  for (const a of plan.actions) {
    { const r = ensureSpace(doc, page, y, 36, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    // Title line with accent underline
    page.drawText(`• ${a.title}`, { x: PAGE.margin, y, size: 11, font: fontBold, color: THEME.text });
    page.drawLine({ start: { x: PAGE.margin, y: y - 3 }, end: { x: PAGE.width - PAGE.margin, y: y - 3 }, thickness: 0.5, color: THEME.border });
    y -= GAP.line;
    const stepLines = a.steps.flatMap(s => wrapByWidth(font, `- ${s}`, 10, PAGE.width - PAGE.margin * 2 - 12));
    for (const l of stepLines) {
      { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.muted);
      y -= GAP.line;
    }
    y -= 4;
    // Rationale (why)
    if ((a as any).rationale) {
      const rl = wrapByWidth(font, `Por que: ${(a as any).rationale}`, 10, PAGE.width - PAGE.margin * 2 - 12);
      for (const l of rl) { { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; } drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.text); y -= GAP.line; }
    }
    // Supporting data bullets
    const sup: any[] | undefined = (a as any).supportingData;
    if (Array.isArray(sup) && sup.length) {
      const label = wrapByWidth(fontBold, 'Dados/Referências:', 10, PAGE.width - PAGE.margin * 2 - 12);
      for (const l of label) { drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.text); y -= GAP.line; }
      for (const d of sup) {
        const dl = wrapByWidth(font, `- ${d}`, 10, PAGE.width - PAGE.margin * 2 - 12);
        for (const l of dl) { drawTextMixed(page, PAGE.margin + 18, y, l, 10, THEME.muted); y -= GAP.line; }
      }
      y -= 4;
    }
    if (a.owners?.length) {
      const ownersLine = wrapByWidth(font, `Responsáveis: ${a.owners.join(', ')}`, 9, PAGE.width - PAGE.margin * 2 - 12);
      for (const l of ownersLine) { drawTextMixed(page, PAGE.margin + 12, y, l, 9, THEME.accent); y -= GAP.line; }
    }
    if (a.kpis?.length) {
      const kLine = wrapByWidth(font, `KPIs: ${a.kpis.join(', ')}`, 9, PAGE.width - PAGE.margin * 2 - 12);
      for (const l of kLine) { drawTextMixed(page, PAGE.margin + 12, y, l, 9, THEME.accent); y -= GAP.line; }
    }
    y -= GAP.block;
  }

  // 4) Timeline
  y = drawSectionTitle(page, y, 'Cronograma', fontBold);
  for (const t of plan.timeline) {
    { const r = ensureSpace(doc, page, y, 26, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
    // Bullet circle marker
    page.drawRectangle({ x: PAGE.margin - 2, y: y - 2, width: 4, height: 4, color: THEME.primary });
    page.drawText(`${t.label}`, { x: PAGE.margin + 6, y, size: 11, font: fontBold, color: THEME.text });
    y -= GAP.line;
    for (const d of t.deliverables) {
      { const r = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = r.page; y = r.y; }
      const lns = wrapByWidth(font, `- ${d}`, 10, PAGE.width - PAGE.margin * 2 - 12);
      for (const l of lns) { drawTextMixed(page, PAGE.margin + 12, y, l, 10, THEME.muted); y -= GAP.line; }
    }
    y -= Math.floor(GAP.block / 2);
  }
  y -= GAP.section;

  // 5) Risks
  y = drawSectionTitle(page, y, 'Riscos & Mitigações', fontBold);
  for (const r of plan.risks) {
    { const rr = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = rr.page; y = rr.y; }
    const lns = wrapByWidth(font, `• ${r}`, 10, PAGE.width - PAGE.margin * 2);
    for (const l of lns) { drawTextMixed(page, PAGE.margin, y, l, 10, THEME.text); y -= GAP.line; }
  }
  y -= GAP.section;
  // 6) Monitoring
  y = drawSectionTitle(page, y, 'Monitoramento & Próximos Passos', fontBold);
  for (const m of plan.monitoring) {
    { const rr = ensureSpace(doc, page, y, GAP.line + 2, font, fontBold, plan.title, meta); page = rr.page; y = rr.y; }
    const lns = wrapByWidth(font, `• ${m}`, 10, PAGE.width - PAGE.margin * 2);
    for (const l of lns) { drawTextMixed(page, PAGE.margin, y, l, 10, THEME.text); y -= GAP.line; }
  }

  // Footer with page numbers and brand
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    const yb = 28;
    p.drawLine({ start: { x: PAGE.margin, y: yb + 8 }, end: { x: PAGE.width - PAGE.margin, y: yb + 8 }, thickness: 0.5, color: THEME.border });
    p.drawText(`Quant Politico - Inteligência Eleitoral`, { x: PAGE.margin, y: yb, size: 9, font, color: THEME.muted });
    const label = `Página ${idx + 1} de ${pages.length}`;
    const approx = label.length * 5;
    p.drawText(label, { x: PAGE.width - PAGE.margin - approx, y: yb, size: 9, font, color: THEME.muted });
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
}
