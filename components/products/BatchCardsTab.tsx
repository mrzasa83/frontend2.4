'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import FilePreviewModal from '@/components/products/FilePreviewModal'
import {
  RefreshCw, Eye, Download, FolderPlus, Archive, Trash2, AlertTriangle, FileText,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { hasRole } from '@/lib/config/access'

/**
 * Batch cards for a part, read from the job folder on the J drive.
 *
 * Generated cards live in a `_fe2` folder inside the part's documents folder,
 * which differs by part type (assemblies and PCBs file them in different
 * places). Superseded cards are datestamped into `_fe2/archive` rather than
 * deleted, so the current set stays obvious without losing history.
 */

type Card = {
  name: string; path: string; size: number; modified: string
  archived: boolean; part: string; stamp: string
}

const fmtWhen = (v: string) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}
const fmtSize = (n: number) =>
  !n ? '' : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`

export default function BatchCardsTab({ partNumber }: { partNumber: string }) {
  const { data: session } = useSession()
  const roles: string[] = ((session?.user as any)?.roles) || []
  const isProductEng = hasRole(roles, 'Admin', 'ProductEng')

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [showArchive, setShowArchive] = useState(false)
  const [preview, setPreview] = useState<{ files: any[]; index: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/batch-cards?part=${encodeURIComponent(partNumber)}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load')
      setData(r)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [partNumber])
  useEffect(() => { load() }, [load])

  const act = async (action: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return
    setBusy(action); setError(''); setNotice('')
    try {
      const res = await fetch(getApiUrl('/api/products/batch-cards'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part: partNumber, action }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Action failed')
      setNotice(
        action === 'ensure' ? (r.message || 'Folders ready.')
        : action === 'archive' ? `Archived ${r.moved} card(s).`
        : action === 'generate' ? (r.message || `Generated ${r.written ?? 0} card(s).`)
        : `Removed ${r.removed} archived card(s).`
      )
      await load()
    } catch (e: any) { setError(e.message) }
    setBusy('')
  }

  const current: Card[] = data?.current || []
  const archived: Card[] = data?.archived || []
  const shown = showArchive ? [...current, ...archived] : current
  const previewList = shown.map(c => ({ name: c.name, path: c.path, extension: 'pdf' }))

  return (
    <div>
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Batch Cards</h3>
          <p className="text-xs text-slate-500">
            Generated cards for this part, highest level first
            {!loading && !error && <> · {current.length} current
              {archived.length > 0 && <> · {archived.length} archived</>}</>}
          </p>
          {data?.fe2Folder && (
            <p className="text-xs text-slate-400 font-mono mt-0.5" title={data.fe2Folder}>
              {data.fe2Folder}
            </p>
          )}
          {/* These are files on disk, not a live view. An app update changes how
              cards are BUILT, not cards already built — which is easy to
              mistake for the update not having landed. */}
          <p className="text-xs text-slate-400 mt-0.5">
            Cards are saved PDFs — regenerate to pick up layout or data changes.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {archived.length > 0 && (
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input type="checkbox" checked={showArchive}
                onChange={e => setShowArchive(e.target.checked)} />
              Show archived
            </label>
          )}
          {isProductEng && (
            <>
              {/* Folders are created as part of generating — no separate step. */}
              <button onClick={() => act('generate')} disabled={!!busy || !data?.jobFolder}
                title="Build a batch card for this part and every component below it"
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
                <FileText size={14} /> {busy === 'generate' ? 'Generating…' : 'Generate'}
              </button>
              {current.length > 0 && (
                <button onClick={() => act('archive', `Archive ${current.length} current card(s)?`)}
                  disabled={!!busy}
                  className="px-3 py-1.5 text-sm border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 disabled:opacity-50">
                  <Archive size={14} /> Archive current
                </button>
              )}
              {archived.length > 0 && (
                <button onClick={() => act('purge', `Permanently delete ${archived.length} archived card(s)? This cannot be undone.`)}
                  disabled={!!busy}
                  className="px-3 py-1.5 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50">
                  <Trash2 size={14} /> Purge archive
                </button>
              )}
            </>
          )}
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {notice && <div className="p-3 mb-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{notice}</div>}

      {!loading && !data?.jobFolder && (
        <div className="p-3 mb-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            No job folder found for {partNumber} under APC EngJobs, so there's nowhere to
            read or write cards. Check the folder exists and is named with the part number.
          </span>
        </div>
      )}
      {!loading && data?.writeError && (
        <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{data.writeError}</span>
        </div>
      )}
      {!loading && data?.jobFolder && !data?.folderExists && !data?.writeError && (
        <div className="p-3 mb-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm">
          No <span className="font-mono">_fe2</span> folder yet — it's created the first time
          cards are generated.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[480px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Part</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">File</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-44">Generated</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-20">Size</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">State</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-20">View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                <RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…
              </td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-sm">
                <FileText size={20} className="inline mr-2 text-slate-300" />
                No batch cards generated yet.
              </td></tr>
            ) : shown.map((c, i) => (
              <tr key={c.path} className={`border-t border-slate-100 ${c.archived ? 'bg-slate-50/60' : 'hover:bg-slate-50'}`}>
                <td className="px-3 py-1.5 font-mono text-slate-800">{c.part}</td>
                <td className="px-3 py-1.5 text-slate-600 text-xs truncate max-w-sm" title={c.path}>{c.name}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtWhen(c.modified)}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtSize(c.size)}</td>
                <td className="px-3 py-1.5">
                  {c.archived
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">archived</span>
                    : <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">current</span>}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setPreview({ files: previewList, index: i })}
                      className="text-slate-500 hover:text-blue-600" title="Preview"><Eye size={15} /></button>
                    <a href={getApiUrl(`/api/files/serve?path=${encodeURIComponent(c.path)}&download=true`)}
                      target="_blank" rel="noopener noreferrer"
                      className="text-slate-500 hover:text-blue-600" title="Download"><Download size={14} /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <FilePreviewModal files={preview.files} index={preview.index}
          onIndexChange={(i: number) => setPreview(p => p ? { ...p, index: i } : p)}
          onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
