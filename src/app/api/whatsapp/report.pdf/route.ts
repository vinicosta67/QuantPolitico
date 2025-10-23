import { NextRequest } from 'next/server';
import { generateNewsReport, type GenerateNewsReportInput } from '@/ai/flows/generate-news-report';
import { newsReportToPdfBytes } from '@/lib/news-report-pdf';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as GenerateNewsReportInput['type']) || 'weekly';
    const query = (searchParams.get('query') || '').toString();
    const daysRaw = Number(searchParams.get('days') || (type === 'daily' ? 1 : type === 'weekly' ? 7 : 7));
    const days = isFinite(daysRaw) && daysRaw > 0 ? Math.min(30, Math.max(1, Math.floor(daysRaw))) : (type === 'daily' ? 1 : type === 'weekly' ? 7 : 7);

    const data = await generateNewsReport({ type, query, days });
    const pdfBytes = await newsReportToPdfBytes(data);
    const stamp = new Date().toISOString().slice(0,10);
    const filename = `Relatorio_noticias_${type}_${stamp}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"` ,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (e: any) {
    return new Response(`Falha ao gerar PDF: ${e?.message || e}`, { status: 500 });
  }
}

