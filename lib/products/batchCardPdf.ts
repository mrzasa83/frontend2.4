import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { promises as fs } from 'fs'
import path from 'path'
import type { CardData } from './batchCardData'

/**
 * Batch card, laid out to match the Paradigm "CUSTOMER PART DETAILS" printout.
 *
 * The header block repeats on every page — only the page number changes —
 * because a card gets separated in the shop and any loose sheet has to identify
 * itself.
 */

const PAGE = { w: 612, h: 792 }   // US Letter portrait
const M = 40
const INK = rgb(0.05, 0.05, 0.08)
const MUTED = rgb(0.42, 0.46, 0.52)
const RULE = rgb(0.75, 0.79, 0.85)
const BAND = rgb(0.85, 0.91, 0.97)

/**
 * DejaVu Sans — metrically close to Verdana and freely licensed, which avoids
 * shipping a Microsoft font in the image. Embedded from the repo rather than
 * relying on a system font, since the runner image carries no font packages.
 * Falls back to Helvetica if the files are missing so a card still renders.
 */
async function loadFonts(doc: PDFDocument): Promise<{ regular: PDFFont; bold: PDFFont }> {
  doc.registerFontkit(fontkit)
  const dir = path.join(process.cwd(), 'assets', 'fonts')
  try {
    const [r, b] = await Promise.all([
      fs.readFile(path.join(dir, 'DejaVuSans.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSans-Bold.ttf')),
    ])
    return {
      regular: await doc.embedFont(r, { subset: true }),
      bold: await doc.embedFont(b, { subset: true }),
    }
  } catch {
    return {
      regular: await doc.embedFont(StandardFonts.Helvetica),
      bold: await doc.embedFont(StandardFonts.HelveticaBold),
    }
  }
}

export type CardMeta = {
  /** DATA0005.EMPL_CODE for the person generating — shown as ID, top right. */
  employeeId: string
  operator: string
}

export async function renderBatchCard(card: CardData, meta: CardMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { regular, bold } = await loadFonts(doc)

  const pages: PDFPage[] = []
  let page!: PDFPage
  let y = 0

  const text = (s: string, x: number, size: number, f: PDFFont = regular, color = INK) => {
    // Verdana covers far more than the standard fonts, but a stray control
    // character would still throw and lose the whole card.
    page.drawText(String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' '), {
      x, y, size, font: f, color,
    })
  }
  const rule = (color = RULE) =>
    page.drawLine({ start: { x: M, y }, end: { x: PAGE.w - M, y }, thickness: 0.7, color })

  const label = (s: string, x: number, yy: number) =>
    page.drawText(s, { x, y: yy, size: 7, font: bold, color: MUTED })

  /** The block that repeats on every page. Returns the y to continue from. */
  const drawHeader = () => {
    let hy = PAGE.h - M

    // Centre column: company, system, document title
    const centre = (s: string, size: number, f: PDFFont, yy: number) => {
      const w = f.widthOfTextAtSize(s, size)
      page.drawText(s, { x: (PAGE.w - w) / 2, y: yy, size, font: f, color: INK })
    }
    centre('Amphenol Printed Circuits, Inc.', 10, bold, hy)
    // Right column: ID / Page / timestamp
    page.drawText(`ID : ${meta.employeeId || '-'}`, { x: PAGE.w - M - 120, y: hy, size: 8, font: regular, color: INK })
    hy -= 11
    centre('4.0 Live', 8, regular, hy)
    page.drawText(`Page : ${pages.length}`, { x: PAGE.w - M - 120, y: hy, size: 8, font: regular, color: INK })
    hy -= 11
    centre('BATCH CARD', 10, bold, hy)
    page.drawText(new Date().toLocaleString(), { x: PAGE.w - M - 120, y: hy, size: 8, font: regular, color: INK })
    hy -= 16

    // Left-aligned field block, labels right-aligned against their values
    const row = (lbl: string, val: string, lbl2?: string, val2?: string) => {
      const lw = bold.widthOfTextAtSize(lbl, 8)
      page.drawText(lbl, { x: 150 - lw, y: hy, size: 8, font: bold, color: INK })
      page.drawText(String(val ?? ''), { x: 156, y: hy, size: 8, font: regular, color: INK })
      if (lbl2) {
        const lw2 = bold.widthOfTextAtSize(lbl2, 8)
        page.drawText(lbl2, { x: 470 - lw2, y: hy, size: 8, font: bold, color: INK })
        page.drawText(String(val2 ?? ''), { x: 476, y: hy, size: 8, font: regular, color: INK })
      }
      hy -= 11
    }
    row('Customer :', `${card.customerCode}   ${card.customerName}`)
    row('Part Number :', card.partNumber, 'Part Revision :', card.revision)
    row('Part Description :', card.description)
    row('BOM Number :', card.bomNumber, 'BOM Revision :', '')
    row('BOM Description :', card.bomDescription)
    if (card.routeName) row('Route :', card.routeName)

    hy -= 4
    page.drawLine({ start: { x: M, y: hy }, end: { x: PAGE.w - M, y: hy }, thickness: 1, color: INK })
    return hy - 14
  }

  const newPage = () => {
    page = doc.addPage([PAGE.w, PAGE.h])
    pages.push(page)
    y = drawHeader()
  }
  const need = (h: number) => { if (y - h < M) newPage() }

  newPage()

  // ---- Bill of material ----
  if (card.bom.length) {
    need(30)
    page.drawRectangle({ x: M, y: y - 3, width: PAGE.w - 2 * M, height: 13, color: BAND })
    text('Bill of Material', (PAGE.w / 2) - 32, 8.5, bold)
    y -= 15
    label('Part Number', M, y); label('Part Description', M + 110, y)
    label('Unit', M + 270, y); label('Required/BOM', M + 310, y)
    label('Qty Required', M + 400, y)
    y -= 3; rule(); y -= 10
    for (const b of card.bom) {
      need(12)
      text(b.partNumber, M, 8)
      text(b.description.slice(0, 28), M + 110, 8)
      text(b.unit, M + 270, 8)
      text(b.requiredPer, M + 310, 8)
      text(b.qtyRequired, M + 400, 8)
      y -= 11
    }
    y -= 6
  }

  // ---- Route steps ----
  for (const s of card.route) {
    need(30)
    text(`Step : ${s.step}`, M + 14, 9, bold)
    text(s.dept, M + 90, 9, bold)
    text(s.deptCode, M + 330, 9, bold)
    // Sign-off boxes
    const bx = PAGE.w - M - 174
    ;['IN/DTE', 'IN/OUT', 'SCRP/IR'].forEach((l, i) => {
      page.drawText(l, { x: bx + i * 58 + 8, y: y + 11, size: 6, font: bold, color: MUTED })
      page.drawRectangle({
        x: bx + i * 58, y: y - 5, width: 54, height: 15,
        borderColor: RULE, borderWidth: 0.7,
      })
    })
    y -= 18

    if (s.params.length) {
      need(24)
      page.drawRectangle({ x: M, y: y - 3, width: PAGE.w - 2 * M, height: 12, color: BAND })
      text('Route Step Parameters', (PAGE.w / 2) - 45, 8, bold)
      y -= 14
      for (const p of s.params) {
        need(11)
        text(`${p.name} : ${p.value}`, M + 20, 7.5, regular, rgb(0.2, 0.24, 0.3))
        y -= 10
      }
      y -= 2
    }
    for (const i of s.instructions) {
      need(11)
      text(i.slice(0, 120), M + 20, 7.5, regular, rgb(0.2, 0.24, 0.3))
      y -= 10
    }
  }

  // ---- Discrepancy sheet ----
  if (card.notes.length) {
    need(30)
    y -= 4
    page.drawRectangle({ x: M, y: y - 3, width: PAGE.w - 2 * M, height: 13, color: BAND })
    text('Discrepancy Sheet', (PAGE.w / 2) - 36, 8.5, bold)
    y -= 16
    for (const n of card.notes) {
      need(11)
      text(n.slice(0, 125), M + 4, 7.5, regular, rgb(0.2, 0.24, 0.3))
      y -= 10
    }
  }

  // Footer on every page, with the final page count known only now.
  pages.forEach((p, i) => {
    p.drawText('Copyright © 1988 - 2026 Aptean', { x: M, y: 24, size: 7, font: regular, color: MUTED })
    const right = `Paradigm® Version 4.0`
    p.drawText(right, {
      x: PAGE.w - M - regular.widthOfTextAtSize(right, 7), y: 24, size: 7, font: regular, color: MUTED,
    })
    // Page N of M, sitting under the header's Page label
    p.drawText(`${i + 1} of ${pages.length}`, {
      x: PAGE.w - M - 60, y: PAGE.h - M - 11, size: 8, font: regular, color: INK,
    })
  })

  return await doc.save()
}
