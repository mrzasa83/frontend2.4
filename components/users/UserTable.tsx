'use client'

import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'

type User = {
  id: number
  username: string
  name: string | null
  email: string | null
  nickname: string | null
  phone: string | null
  mobile: string | null
  title: string | null
  role: string | null
  active: number | null
}

type Props = {
  users: User[]
  onView: (user: User) => void
  onEdit: (user: User) => void
}

export default function UserTable({ users, onView, onEdit }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof User>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortKey] || ''
    const valB = b[sortKey] || ''
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 px-3 py-2 rounded-lg w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setPage(0)
          }}
          className="border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              {['name', 'username', 'email', 'mobile', 'title', 'role'].map((key) => (
                <th
                  key={key}
                  className="text-left px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors font-medium text-sm text-slate-700"
                  onClick={() =>
                    key === sortKey ? setSortAsc(!sortAsc) : setSortKey(key as keyof User)
                  }
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortKey === key && (
                    <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((user) => (
              <tr key={user.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm">{user.name || '-'}</td>
                <td className="px-4 py-3 text-sm">{user.username}</td>
                <td className="px-4 py-3 text-sm">{user.email || '-'}</td>
                <td className="px-4 py-3 text-sm">{user.mobile || '-'}</td>
                <td className="px-4 py-3 text-sm">{user.title || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {user.role || 'No Role'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View User"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Edit User"
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-slate-500">
          Showing {paginated.length} of {filtered.length} users
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = page < 3 ? i : page - 2 + i
            if (pageNum >= totalPages) return null
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded text-sm ${
                  pageNum === page
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
              >
                {pageNum + 1}
              </button>
            )
          })}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}