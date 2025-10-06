import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { GeneratePlanOutput } from '@/ai/flows/generate-recommendation-plan';

export type PlanPdfMeta = {
  politician: string;
  type: string;
  timeframe: string;
};

const PAGE = { width: 595, height: 842, margin: 48 } as const; // A4 portrait

function addHeader(page: any, title: string, meta: PlanPdfMeta, font: any) {
  const { width, height, margin } = PAGE;
  page.drawText(title, { x: margin, y: height - margin - 10, size: 18, font, color: rgb(0.1, 0.1, 0.1) });
  const sub = `Político: ${meta.politician}  •  Aba: ${meta.type}  •  Período: ${meta.timeframe}`;
  page.drawText(sub, { x: margin, y: height - margin - 30, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  page.drawLine({ start: { x: margin, y: height - margin - 38 }, end: { x: width - margin, y: height - margin - 38 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
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
  page.drawText(text, { x: PAGE.margin, y, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
  return y - 14;
}

function ensureSpace(doc: PDFDocument, page: any, y: number, needed: number, font: any, title: string, meta: PlanPdfMeta) {
  if (y - needed < PAGE.margin) {
    const p = doc.addPage([PAGE.width, PAGE.height]);
    const f = font;
    addHeader(p, title, meta, f);
    return { page: p, y: PAGE.height - PAGE.margin - 56 };
  }
  return { page, y };
}

export async function planToPdfBytes(plan: GeneratePlanOutput, meta: PlanPdfMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE.width, PAGE.height]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  addHeader(page, plan.title, meta, font);
  let y = PAGE.height - PAGE.margin - 56;

  // Summary
  ({ page: ((): any => { const r = ensureSpace(doc, page, y, 60, font, plan.title, meta); y = r.y; return r.page; })() });
  y = drawSectionTitle(page, y, 'Resumo Executivo', font);
  const summaryLines = wrapText(plan.summary, 100);
  for (const line of summaryLines) {
    ({ page: ((): any => { const r = ensureSpace(doc, page, y, 14, font, plan.title, meta); y = r.y; return r.page; })() });
    page.drawText(line, { x: PAGE.margin, y, size: 10, font });
    y -= 12;
  }
  y -= 6;

  // Objectives
  y = drawSectionTitle(page, y, 'Objetivos (KPIs)', font);
  for (const obj of plan.objectives) {
    ({ page: ((): any => { const r = ensureSpace(doc, page, y, 14, font, plan.title, meta); y = r.y; return r.page; })() });
    const lines = wrapText(`• ${obj}`, 100);
    for (const l of lines) {
      page.drawText(l, { x: PAGE.margin, y, size: 10, font });
      y -= 12;
    }
  }
  y -= 6;

  // Actions
  y = drawSectionTitle(page, y, 'Ações Recomendadas', font);
  for (const a of plan.actions) {
    ({ page: ((): any => { const r = ensureSpace(doc, page, y, 28, font, plan.title, meta); y = r.y; return r.page; })() });
    page.drawText(`• ${a.title}`, { x: PAGE.margin, y, size: 11, font });
    y -= 12;
    const stepLines = a.steps.flatMap(s => wrapText(`- ${s}`, 95));
    for (const l of stepLines) {
      ({ page: ((): any => { const r = ensureSpace(doc, page, y, 14, font, plan.title, meta); y = r.y; return r.page; })() });
      page.drawText(l, { x: PAGE.margin + 12, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 12;
    }
    if (a.owners?.length) {
      const ownersLine = wrapText(`Responsáveis: ${a.owners.join(', ')}`, 100);
      for (const l of ownersLine) { page.drawText(l, { x: PAGE.margin + 12, y, size: 9, font, color: rgb(0.35,0.35,0.35) }); y -= 12; }
    }
    if (a.kpis?.length) {
      const kLine = wrapText(`KPIs: ${a.kpis.join(', ')}`, 100);
      for (const l of kLine) { page.drawText(l, { x: PAGE.margin + 12, y, size: 9, font, color: rgb(0.35,0.35,0.35) }); y -= 12; }
    }
    y -= 4;
  }

  // Timeline
  y = drawSectionTitle(page, y, 'Cronograma', font);
  for (const t of plan.timeline) {
    ({ page: ((): any => { const r = ensureSpace(doc, page, y, 22, font, plan.title, meta); y = r.y; return r.page; })() });
    page.drawText(`• ${t.label}`, { x: PAGE.margin, y, size: 11, font });
    y -= 12;
    for (const d of t.deliverables) {
      ({ page: ((): any => { const r = ensureSpace(doc, page, y, 14, font, plan.title, meta); y = r.y; return r.page; })() });
      const lns = wrapText(`- ${d}`, 95);
      for (const l of lns) { page.drawText(l, { x: PAGE.margin + 12, y, size: 10, font }); y -= 12; }
    }
  }

  // Risks
  y = drawSectionTitle(page, y, 'Riscos & Mitigações', font);
  for (const r of plan.risks) {
    ({ page: ((): any => { const rr = ensureSpace(doc, page, y, 14, font, plan.title, meta); y = rr.y; return rr.page; })() });
    const lns = wrapText(`• ${r}`, 100);
    for (const l of lns) { page.drawText(l, { x: PAGE.margin, y, size: 10, font }); y -= 12; }
  }

  // Monitoring
  y = drawSectionTitle(page, y, 'Monitoramento & Próximos Passos', font);
  for (const m of plan.monitoring) {
    ({ page: ((): any => { const rr = ensureSpace(doc, page, y, 14, font, plan.title, meta); y = rr.y; return rr.page; })() });
    const lns = wrapText(`• ${m}`, 100);
    for (const l of lns) { page.drawText(l, { x: PAGE.margin, y, size: 10, font }); y -= 12; }
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

