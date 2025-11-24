'use client'

import { useState } from 'react'
import Tabs from '@/components/ui/Tabs'
import { Save, X } from 'lucide-react'

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
  onSave: (user: User) => void
  onCancel: () => void
}

export default function UserEditTab({ user, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState(user)
  const [hasChanges, setHasChanges] = useState(false)
  const [innerTab, setInnerTab] = useState('personal')

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(formData)
    setHasChanges(false)
  }

  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"

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
            className={inputClassName}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Additional occupation details (department, manager, start date, etc.) can be added here in future updates.
        </p>
      </div>
    </div>
  )

  const tabs = [
    { id: 'personal', label: 'Personal', content: personalTab, closeable: false },
    { id: 'occupation', label: 'Occupation', content: occupationTab, closeable: false },
  ]

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Editing: {formData.name || formData.username}
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

      {/* Form Tabs */}
      <Tabs tabs={tabs} activeTab={innerTab} onTabChange={setInnerTab} />
    </div>
  )
}