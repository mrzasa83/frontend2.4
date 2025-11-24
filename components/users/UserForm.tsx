'use client'

import { useState } from 'react'
import Tabs from '@/components/ui/Tabs'
import { X, Save } from 'lucide-react'

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
  user: User
  mode: 'view' | 'edit'
  onClose: () => void
  onSave?: (user: User) => void
}

export default function UserForm({ user, mode, onClose, onSave }: Props) {
  const [formData, setFormData] = useState(user)
  const isReadOnly = mode === 'view'
  const [activeTab, setActiveTab] = useState('personal')

  const handleChange = (field: keyof User, value: any) => {
    if (isReadOnly) return
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
  }

  const inputClassName = `w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
    isReadOnly ? 'bg-slate-50 cursor-not-allowed' : ''
  }`

  // Personal Tab Content
  const personalTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nickname
          </label>
          <input
            type="text"
            value={formData.nickname || ''}
            onChange={(e) => handleChange('nickname', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mobile
          </label>
          <input
            type="tel"
            value={formData.mobile || ''}
            onChange={(e) => handleChange('mobile', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.active === 1}
            onChange={(e) => handleChange('active', e.target.checked ? 1 : 0)}
            disabled={isReadOnly}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">Active User</span>
        </label>
      </div>
    </div>
  )

  // Occupation Tab Content
  const occupationTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Role
          </label>
          <input
            type="text"
            value={formData.role || ''}
            onChange={(e) => handleChange('role', e.target.value)}
            readOnly={isReadOnly}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg">
        <p className="text-sm text-slate-600">
          Additional occupation details can be added here in future updates.
        </p>
      </div>
    </div>
  )

  const tabs = [
    { id: 'personal', label: 'Personal', content: personalTab },
    { id: 'occupation', label: 'Occupation', content: occupationTab },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'view' ? 'View User' : 'Edit User'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {mode === 'view' 
                ? 'User information (read-only)' 
                : 'Update user information'}
            </p>
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
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {mode === 'edit' && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}