'use client'

import { useState } from 'react'
import Tabs from '@/components/ui/Tabs'
import { X, Save, UserPlus } from 'lucide-react'

type NewUser = {
  username: string
  name: string
  email: string
  nickname: string
  phone: string
  mobile: string
  title: string
  role: string
  password: string
  active: number
}

type Props = {
  onClose: () => void
  onSave: (user: NewUser) => void
}

export default function UserAddForm({ onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState<NewUser>({
    username: '',
    name: '',
    email: '',
    nickname: '',
    phone: '',
    mobile: '',
    title: '',
    role: '',
    password: '',
    active: 1
  })

  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleChange = (field: keyof NewUser, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
    } else {
      // If validation fails, show which tab has errors
      if (errors.username || errors.name || errors.email || errors.nickname) {
        setActiveTab('personal')
      } else if (errors.title || errors.role) {
        setActiveTab('occupation')
      } else if (errors.password || errors.confirmPassword) {
        setActiveTab('security')
      }
    }
  }

  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
  const errorClassName = "w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-red-50"

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
            className={errors.username ? errorClassName : inputClassName}
            placeholder="Enter username"
          />
          {errors.username && (
            <p className="text-red-600 text-xs mt-1">{errors.username}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={errors.name ? errorClassName : inputClassName}
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="text-red-600 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={errors.email ? errorClassName : inputClassName}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nickname
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
            className={inputClassName}
            placeholder="Enter nickname"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={inputClassName}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mobile
          </label>
          <input
            type="tel"
            value={formData.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            className={inputClassName}
            placeholder="(555) 987-6543"
          />
        </div>

        <div className="col-span-2">
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
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={inputClassName}
            placeholder="e.g., Engineer, Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className={inputClassName}
          >
            <option value="">Select role...</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg">
        <p className="text-sm text-slate-600">
          Additional occupation details can be configured after user creation.
        </p>
      </div>
    </div>
  )

  // Security Tab Content
  const securityTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={errors.password ? errorClassName : inputClassName}
            placeholder="Enter password"
          />
          {errors.password && (
            <p className="text-red-600 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm Password *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) {
                setErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors.confirmPassword
                  return newErrors
                })
              }
            }}
            className={errors.confirmPassword ? errorClassName : inputClassName}
            placeholder="Confirm password"
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Password Requirements:</strong>
        </p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>• Minimum 6 characters</li>
          <li>• User will be able to change password after first login</li>
        </ul>
      </div>
    </div>
  )

  const tabs = [
    { id: 'personal', label: 'Personal', content: personalTab, closeable: false },
    { id: 'occupation', label: 'Occupation', content: occupationTab, closeable: false },
    { id: 'security', label: 'Security', content: securityTab, closeable: false },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Add New User</h2>
              <p className="text-sm text-slate-600 mt-1">Create a new user account</p>
            </div>
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            Create User
          </button>
        </div>
      </div>
    </div>
  )
}