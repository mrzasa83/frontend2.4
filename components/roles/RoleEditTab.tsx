'use client'

import { useState, useEffect } from 'react'
import { Save, X, UserPlus, UserMinus } from 'lucide-react'

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

type User = {
  id: number
  username: string
  name: string
  email: string
}

type Props = {
  role: Role
  onSave: (role: Role) => void
  onCancel: () => void
  onAddUser: (roleId: number, userId: number) => Promise<void>
  onRemoveUser: (roleId: number, userId: number) => Promise<void>
}

export default function RoleEditTab({ role, onSave, onCancel, onAddUser, onRemoveUser }: Props) {
  const [formData, setFormData] = useState(role)
  const [hasChanges, setHasChanges] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleChange = (field: keyof Role, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(formData)
    setHasChanges(false)
  }

  const handleAddUser = async () => {
    if (!selectedUserId) return
    
    setLoading(true)
    try {
      await onAddUser(role.id, selectedUserId)
      setShowAddUser(false)
      setSelectedUserId(null)
      // Refresh would happen in parent
    } catch (error) {
      console.error('Error adding user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: number) => {
    if (!confirm('Remove this user from the role?')) return
    
    setLoading(true)
    try {
      await onRemoveUser(role.id, userId)
      // Refresh would happen in parent
    } catch (error) {
      console.error('Error removing user:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter out users already in role
  const availableUsers = allUsers.filter(
    u => !formData.users.some(ru => ru.id === u.id)
  )

  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Editing: {formData.name}
          </h3>
          {hasChanges && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠ You have unsaved changes
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Role Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Role Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={inputClassName}
          placeholder="Enter role name"
        />
      </div>

      {/* Users in Role */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-800">
            Users in this Role ({formData.users.length})
          </h4>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex gap-3">
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select a user...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddUser}
                disabled={!selectedUserId || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium text-slate-700">Name</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-slate-700">Username</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-slate-700">Email</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.users.map(user => (
                <tr key={user.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm">{user.name}</td>
                  <td className="px-4 py-2 text-sm font-mono">{user.username}</td>
                  <td className="px-4 py-2 text-sm">{user.email}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={loading}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Remove from role"
                    >
                      <UserMinus size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {formData.users.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No users assigned to this role
            </div>
          )}
        </div>
      </div>
    </div>
  )
}