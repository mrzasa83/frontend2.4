'use client'

import { X } from 'lucide-react'

type Role = {
  id: number
  name: string
  users: Array<{
    id: number
    username: string
    name: string
    email: string
  }>
  createdAt: string
  updatedAt: string
}

type Props = {
  role: Role
  onClose: () => void
}

export default function RoleView({ role, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">View Role</h2>
            <p className="text-sm text-slate-600 mt-1">Role details (read-only)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Role Info */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role Name
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold">
                {role.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Created At
                </label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 text-sm">
                  {new Date(role.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Updated At
                </label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 text-sm">
                  {new Date(role.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Users */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">
                Users in this Role ({role.users.length})
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-medium text-slate-700">Name</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-slate-700">Username</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-slate-700">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {role.users.map(user => (
                      <tr key={user.id} className="border-t border-slate-200">
                        <td className="px-4 py-2 text-sm">{user.name}</td>
                        <td className="px-4 py-2 text-sm font-mono">{user.username}</td>
                        <td className="px-4 py-2 text-sm">{user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {role.users.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No users assigned to this role
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}