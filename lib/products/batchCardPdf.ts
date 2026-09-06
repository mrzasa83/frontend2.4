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
async function loadFonts(doc: PDFDocument): Promise<{
  regular: PDFFont; bold: PDFFont; mono: PDFFont; monoBold: PDFFont
}> {
  doc.registerFontkit(fontkit)
  const dir = path.join(process.cwd(), 'assets', 'fonts')
  try {
    const [r, b, m, mb] = await Promise.all([
      fs.readFile(path.join(dir, 'DejaVuSans.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSans-Bold.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSansMono.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSansMono-Bold.ttf')),
    ])
    return {
      regular: await doc.embedFont(r, { subset: true }),
      bold: await doc.embedFont(b, { subset: true }),
      mono: await doc.embedFont(m, { subset: true }),
      monoBold: await doc.embedFont(mb, { subset: true }),
    }
  } catch {
    const h = await doc.embedFont(StandardFonts.Helvetica)
    const hb = await doc.embedFont(StandardFonts.HelveticaBold)
    return { regular: h, bold: hb, mono: h, monoBold: hb }
  }
}

export type CardMeta = {
  /** DATA0005.EMPL_CODE for the person generating — shown as ID, top right. */
  employeeId: string
  operator: string
}

export async function renderBatchCard(card: CardData, meta: CardMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { regular, bold, mono, monoBold } = await loadFonts(doc)

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

  /**
   * The block that repeats on every page — only the page number changes, since
   * a card gets separated in the shop and any loose sheet has to identify
   * itself. Returns the y to continue from.
   *
   * The right-hand column has its COLONS aligned, matching the Paradigm
   * printout: labels are right-aligned to a colon column, values start after it.
   */
  const drawHeader = () => {
    let hy = PAGE.h - M

    const centre = (str: string, size: number, f: PDFFont, yy: number) => {
      const w = f.widthOfTextAtSize(str, size)
      page.drawText(str, { x: (PAGE.w - w) / 2, y: yy, size, font: f, color: INK })
    }
    // Right column with a fixed colon position.
    const COLON_X = PAGE.w - M - 52
    const rightPair = (lbl: string, val: string, yy: number) => {
      const w = mono.widthOfTextAtSize(lbl, 8)
      page.drawText(lbl, { x: COLON_X - 4 - w, y: yy, size: 8, font: mono, color: INK })
      page.drawText(':', { x: COLON_X, y: yy, size: 8, font: mono, color: INK })
      page.drawText(String(val ?? ''), { x: COLON_X + 8, y: yy, size: 8, font: mono, color: INK })
    }

    centre('Amphenol Printed Circuits, Inc.', 10, monoBold, hy)
    rightPair('ID', meta.employeeId || '-', hy)
    hy -= 11
    centre('4.0 Live', 8, mono, hy)
    rightPair('Page', String(pages.length), hy)
    hy -= 11
    centre('CUSTOMER PART DETAILS', 10, monoBold, hy)
    page.drawText(new Date().toLocaleString(), {
      x: COLON_X - 4 - mono.widthOfTextAtSize(new Date().toLocaleString(), 8) + 60,
      y: hy, size: 8, font: mono, color: INK,
    })
    hy -= 16

    // Left field block: labels right-aligned to a colon column.
    const L_COLON = 150
    const row = (
      lbl: string, val: string, lblBold = true,
      lbl2?: string, val2?: string, lbl2Bold = true,
    ) => {
      const f = lblBold ? monoBold : mono
      const w = f.widthOfTextAtSize(lbl, 8)
      page.drawText(lbl, { x: L_COLON - 4 - w, y: hy, size: 8, font: f, color: INK })
      page.drawText(':', { x: L_COLON, y: hy, size: 8, font: f, color: INK })
      page.drawText(String(val ?? ''), { x: L_COLON + 8, y: hy, size: 8, font: mono, color: INK })
      if (lbl2) {
        const f2 = lbl2Bold ? monoBold : mono
        const w2 = f2.widthOfTextAtSize(lbl2, 8)
        page.drawText(lbl2, { x: 470 - w2, y: hy, size: 8, font: f2, color: INK })
        page.drawText(':', { x: 474, y: hy, size: 8, font: f2, color: INK })
        page.drawText(String(val2 ?? ''), { x: 482, y: hy, size: 8, font: mono, color: INK })
      }
      hy -= 11
    }

    row('Customer', `${card.customerCode}   ${card.customerName}`)
    row('Part Number', card.partNumber, true, 'Part Revision', card.revision)
    row('Part Description', card.description)
    row('BOM Number', card.bomNumber, true, 'BOM Revision', '')
    row('BOM Description', card.bomDescription)
    // Route and Product Code are NOT bold on the original printout.
    if (card.routeCode || card.routeName) {
      row('Route', `${card.routeCode}      ${card.routeName}`.trim(), false,
          undefined, undefined)
    }
    if (card.productCode || card.productName) {
      // Catalog Number sits in the right column on this line; neither label is
      // bold on the original.
      row('Product Code', `${card.productCode}   ${card.productName}`.trim(), false,
          card.catalogNumber ? 'Catalog Number' : undefined, card.catalogNumber, false)
    }

    if (card.enteredBy || card.enteredDate) {
      row('Entered By', card.enteredBy, true, 'Entered Date', card.enteredDate)
    }
    if (card.modifiedBy || card.modifiedDate) {
      row('Last Modified By', card.modifiedBy, true, 'Modified Date', card.modifiedDate)
    }

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

  const band = (title: string) => {
    need(24)
    page.drawRectangle({ x: M, y: y - 3, width: PAGE.w - 2 * M, height: 13, color: BAND })
    const w = bold.widthOfTextAtSize(title, 8.5)
    text(title, (PAGE.w - w) / 2, 8.5, bold)
    y -= 16
  }

  // Single column, as on the original printout: label, then value.
  const pairs = (list: { name: string; value: string }[]) => {
    for (const p of list) {
      need(11)
      text(p.name, M + 6, 7.5, mono, MUTED)
      text(p.value, M + 170, 7.5, mono)
      y -= 10
    }
    y -= 4
  }

  if (card.comments.length) {
    band('Part Data Comments')
    for (const line of card.comments) {
      need(11)
      text(line.slice(0, 120), M + 6, 7.5, mono, rgb(0.2, 0.24, 0.3))
      y -= 10
    }
    y -= 4
  }

  if (card.parameters.length) { band('Production Part Parameters'); pairs(card.parameters) }
  if (card.specs.length) { band('Customer Part Specifications'); pairs(card.specs) }
  if (card.units.length) {
    band('Unit Loading Factors')
    label('Unit Name', M + 6, y); label('Unit Code', M + 250, y)
    label('Part Loading Factor', M + 360, y)
    y -= 3; rule(); y -= 10
    for (const u of card.units) {
      need(11)
      text(u.description, M + 6, 7.5)
      text(u.code, M + 250, 7.5)
      text(u.value, M + 360, 7.5)
      y -= 10
    }
    y -= 4
  }

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
  })

  return await doc.save()
}
