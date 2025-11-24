'use client'

import { useState } from 'react'
import { Eye, Pencil, Trash2, Users } from 'lucide-react'

type Role = {
  id: number
  name: string
  userCount: number
  createdAt: string
  updatedAt: string
}

type Props = {
  roles: Role[]
  onView: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

export default function RolesTable({ roles, onView, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('')

  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 px-3 py-2 rounded-lg w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Role Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Users
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Created
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((role) => (
              <tr key={role.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                  {role.name}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <span>{role.userCount}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(role.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(role)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Role"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(role)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Edit Role"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(role)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No roles found
        </div>
      )}
    </div>
  )
}