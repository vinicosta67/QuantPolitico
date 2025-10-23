import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type SixHourNewsItem = {
  id: string
  title: string
  sourceurl: string
  summary?: string
  publishedAt?: number | string
  polaridade?: number
}

const PAGE = { width: 595, height: 842, margin: 48 } as const
const GAP = { line: 14, block: 18, section: 24 } as const

function sanitizeWinAnsi(text: string): string {
  if (!text) return ''
  let out = String(text).normalize('NFC')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2022\u2023\u25E6]/g, '*')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u2000-\u206F]/g, ' ')
    // Remove stray combining marks that WinAnsi can't encode
    .replace(/[\u0300-\u036F]/g, '')
    // Finally drop anything outside Latin-1 (WinAnsi)
    .replace(/[^\u0000-\u00FF]/g, '')
  return out
}

function wrapLinesByWidth(font: any, text: string, size: number, maxWidth: number): string[] {
  const words = sanitizeWinAnsi(text || '').split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const trial = current ? current + ' ' + w : w
    const width = font.widthOfTextAtSize(trial, size)
    if (width > maxWidth && current) {
      lines.push(current)
      current = w
    } else {
      current = trial
    }
  }
  if (current) lines.push(current)
  return lines
}

function formatDateLabel(value?: number | string) {
  if (value === undefined || value === null) return ''
  const d = typeof value === 'number' ? new Date(value) : new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { hour12: false })
}

function formatSentimentLabel(v?: number) {
  if (typeof v !== 'number') return 'Neutro'
  return v > 0.3 ? 'Positiva' : v < -0.3 ? 'Negativa' : 'Neutro'
}

function sentimentEmoji(v?: number) {
  if (typeof v !== 'number') return ':-|'
  return v > 0.3 ? ':)' : v < -0.3 ? ':(' : ':-|'
}

export async function newsListToPdfBytes(items: SixHourNewsItem[], title = 'Notícias (últimas 6 horas)'): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  let page = doc.addPage([PAGE.width, PAGE.height])
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const { width, height, margin } = PAGE
  const maxW = width - margin * 2
  let y = height - margin

  // Header brand bar
  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: rgb(0, 0.5, 0.5) })
  page.drawRectangle({ x: 0, y: height - 38, width, height: 2, color: rgb(0.96, 0.62, 0.04) })
  page.drawText('Quant Político', { x: margin, y: height - 26, size: 11, font: fontBold, color: rgb(1, 1, 1) })

  // Title
  const titleLines = wrapLinesByWidth(fontBold, sanitizeWinAnsi(title), 18, maxW)
  y -= 10
  for (const l of titleLines) { page.drawText(l, { x: margin, y, size: 18, font: fontBold }); y -= GAP.line }
  page.drawText(sanitizeWinAnsi(new Date().toLocaleString('pt-BR')), { x: margin, y, size: 10, font: fontRegular, color: rgb(0.35, 0.35, 0.35) })
  y -= GAP.section

  const drawRule = () => page.drawRectangle({ x: margin, y: y + 4, width: maxW, height: 1, color: rgb(0.9, 0.9, 0.9) })

  for (let i = 0; i < items.length; i++) {
    const n = items[i]
    const source = (() => {
      try {
        const u = new URL(n.sourceurl)
        return u.hostname.replace(/^www\./, '')
      } catch { return n.sourceurl }
    })()
    const dateLabel = formatDateLabel(n.publishedAt)
    const sentimentLabel = formatSentimentLabel(typeof n.polaridade === 'number' ? n.polaridade : undefined)

    // Add page if needed
    if (y < margin + 120) {
      page = doc.addPage([PAGE.width, PAGE.height])
      y = height - margin
    }

    // Title line
    const titleText = `${i + 1}) ${n.title || ''}`
    const titleWrapped = wrapLinesByWidth(fontBold, titleText, 13, maxW)
    for (const l of titleWrapped) { page.drawText(sanitizeWinAnsi(l), { x: margin, y, size: 13, font: fontBold }); y -= 12 }

    // Small source badge (mimic 'Broadcast')
    page.drawText('Broadcast', { x: margin, y, size: 9, font: fontBold, color: rgb(0.35, 0.35, 0.35) });
    y -= 10

    // Meta line: fonte • data • sentimento + emoji
    const metaParts = [source || '', dateLabel || '', sentimentLabel ? `Sentimento: ${sentimentLabel} ${sentimentEmoji(n.polaridade as any)}` : ''].filter(Boolean)
    if (metaParts.length) { page.drawText(sanitizeWinAnsi(metaParts.join(' • ')), { x: margin, y, size: 10, font: fontRegular, color: rgb(0.35, 0.35, 0.35) }); y -= GAP.line }

    // Summary
    const summary = n.summary || ''
    if (summary) {
      const lines = wrapLinesByWidth(fontRegular, summary, 11, maxW)
      const limited = lines.slice(0, 4)
      for (const l of limited) { page.drawText(sanitizeWinAnsi(l), { x: margin, y, size: 11, font: fontRegular }); y -= 12 }
      if (lines.length > 4) { page.drawText('...', { x: margin, y, size: 11, font: fontRegular }); y -= 12 }
    }

    // Link
    const link = n.sourceurl
    if (link) { page.drawText(sanitizeWinAnsi(link), { x: margin, y, size: 10, font: fontRegular, color: rgb(0.1,0.32,0.65), link }); y -= GAP.block }

    drawRule()
    y -= 10
  }

  return await doc.save()
}
