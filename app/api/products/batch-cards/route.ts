import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule, hasRole } from '@/lib/config/access'
import {
  listBatchCards, resolveBatchCardFolders, archiveStamp,
} from '@/lib/products/batchCardFiles'
import { buildCardSet } from '@/lib/products/batchCardData'
import { renderBatchCard } from '@/lib/products/batchCardPdf'
import { networkUsernameFor } from '@/lib/config/networkUsername'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { queryMSSQL } from '@/lib/db/mssql'
import { hasColumn } from '@/lib/db/schemaProbe'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const canGenerate = (roles: string[]) => hasRole(roles, 'Admin', 'ProductEng')

// GET ?part=12807 -> the batch cards on the J drive for this part.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const part = (new URL(request.url).searchParams.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const { location, current, archived } = await listBatchCards(part)
    return NextResponse.json({
      success: true,
      part,
      jobFolder: location.jobFolder,
      docFolder: location.docFolder,
      fe2Folder: location.fe2Folder,
      folderExists: location.exists,
      writeError: location.writeError,
      itemTypeId: location.itemTypeId,
      current,
      archived,
      canGenerate: canGenerate(roles),
    })
  } catch (error) {
    console.error('Batch card list error:', error)
    return NextResponse.json({
      error: 'Failed to list batch cards',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

/**
 * POST — folder maintenance. Product Engineering only.
 *   action=ensure   create the documents/_fe2 folders if the job predates them
 *   action=archive  datestamp the current cards into _fe2/archive
 *   action=purge    delete everything in _fe2/archive
 *
 * Generation itself isn't here yet; these are the folder operations it needs.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canGenerate(roles)) {
    return NextResponse.json({
      error: 'Only Product Engineering can change batch card folders',
    }, { status: 403 })
  }

  try {
    const b = await request.json()
    const part = String(b?.part ?? '').trim()
    const action = String(b?.action ?? '').trim()
    if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

    if (action === 'ensure') {
      const loc = await resolveBatchCardFolders(part, true)
      if (!loc.jobFolder) {
        return NextResponse.json({
          error: `No job folder found for ${part} under APC EngJobs.`,
        }, { status: 404 })
      }
      if (loc.writeError) {
        return NextResponse.json({ error: loc.writeError }, { status: 500 })
      }
      return NextResponse.json({
        success: true, created: loc.created, fe2Folder: loc.fe2Folder,
        message: loc.created.length ? `Created ${loc.created.length} folder(s).` : 'Folders already present.',
      })
    }

    if (action === 'archive') {
      const { location, current } = await listBatchCards(part)
      if (!location.fe2Folder) {
        return NextResponse.json({ error: 'No _fe2 folder for this part.' }, { status: 404 })
      }
      await fs.mkdir(location.archiveFolder!, { recursive: true })
      const stamp = archiveStamp()
      let moved = 0
      for (const f of current) {
        const base = f.name.replace(/\.pdf$/i, '')
        const target = path.join(location.archiveFolder!, `${base}__${stamp}.pdf`)
        try { await fs.rename(f.path, target); moved++ } catch { /* skip locked files */ }
      }
      return NextResponse.json({ success: true, moved, stamp })
    }

    if (action === 'generate') {
      // Folders are created as part of generating, so there's no separate step.
      const loc = await resolveBatchCardFolders(part, true)
      if (!loc.jobFolder) {
        return NextResponse.json({
          error: `No job folder found for ${part} under APC EngJobs.`,
        }, { status: 404 })
      }
      if (loc.writeError) {
        return NextResponse.json({ error: loc.writeError }, { status: 500 })
      }

      // The operator's ERP login goes in the card header.
      const username = (session.user as any)?.username || ''
      let stored: string | null = null
      try {
        if (await hasColumn('Users', 'network_username')) {
          const rows = await queryPrimary<any[]>(
            'SELECT network_username FROM Users WHERE username = ? LIMIT 1', [username])
          stored = rows?.[0]?.network_username ?? null
        }
      } catch { /* fall back to the derived value */ }
      const operator = networkUsernameFor(username, stored)

      // The ID in the header is the Paradigm employee code for that network
      // name. Matched case-insensitively — the ERP stores it upper case while
      // the derived value is lower.
      let employeeId = ''
      try {
        const emp = await queryMSSQL<any[]>('1',
          `SELECT TOP 1 LTRIM(RTRIM(EMPL_CODE)) AS code
           FROM DATA0005 WITH (NOLOCK)
           WHERE UPPER(LTRIM(RTRIM(ABBR_NAME))) = UPPER(@abbr)`,
          { abbr: operator })
        employeeId = String(emp?.[0]?.code ?? '').trim()
      } catch (e) {
        console.error('Employee code lookup failed for', operator, e)
      }

      const cards = await buildCardSet(part)
      if (!cards.length) {
        return NextResponse.json({
          error: `No Paradigm record found for ${part}.`,
        }, { status: 404 })
      }

      // Supersede rather than overwrite: existing cards are datestamped into
      // the archive so history survives a regeneration.
      const { current } = await listBatchCards(part)
      if (current.length) {
        await fs.mkdir(loc.archiveFolder!, { recursive: true })
        const stamp = archiveStamp()
        for (const f of current) {
          const base = f.name.replace(/\.pdf$/i, '')
          try {
            await fs.rename(f.path, path.join(loc.archiveFolder!, `${base}__${stamp}.pdf`))
          } catch { /* leave a locked file where it is */ }
        }
      }

      let written = 0
      const failed: string[] = []
      for (const card of cards) {
        const safeName = card.partNumber.replace(/[\\/:*?"<>|]/g, '_')
        try {
          const bytes = await renderBatchCard(card, { employeeId, operator })
          await fs.writeFile(path.join(loc.fe2Folder!, `${safeName}.pdf`), bytes)
          written++
        } catch (e) {
          failed.push(`${card.partNumber}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      return NextResponse.json({
        success: true, written, cards: cards.length, operator, employeeId,
        failed,
        message: `Generated ${written} card(s) for ${part} as ${operator}` +
                 `${employeeId ? ` (ID ${employeeId})` : ' — no Paradigm employee code found for that network name'}` +
                 `${failed.length ? `, ${failed.length} failed` : ''}.`,
      })
    }

    if (action === 'purge') {
      const { location, archived } = await listBatchCards(part)
      if (!location.archiveFolder) {
        return NextResponse.json({ error: 'No archive folder for this part.' }, { status: 404 })
      }
      let removed = 0
      for (const f of archived) {
        try { await fs.unlink(f.path); removed++ } catch { /* skip locked files */ }
      }
      return NextResponse.json({ success: true, removed })
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 })
  } catch (error) {
    console.error('Batch card action error:', error)
    return NextResponse.json({
      error: 'Action failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
