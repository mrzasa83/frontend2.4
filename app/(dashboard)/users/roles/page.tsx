'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Tabs from '@/components/ui/Tabs'
import RolesTable from '@/components/roles/RolesTable'
import RoleView from '@/components/roles/RoleView'
import RoleEditTab from '@/components/roles/RoleEditTab'
import { Plus } from 'lucide-react'

type Role = {
  id: number
  name: string
  userCount: number
  createdAt: string
  updatedAt: string
}

type RoleDetail = {
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

export default function RolesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewRole, setViewRole] = useState<RoleDetail | null>(null)
  const [editingRoles, setEditingRoles] = useState<RoleDetail[]>([])
  const [activeTab, setActiveTab] = useState('all')

  const isAdmin = session?.user?.roles?.includes('admin') || false

  useEffect(() => {
    if (!isAdmin) {
      router.push('/users')
      return
    }
    fetchRoles()
  }, [isAdmin, router])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch('/api/roles')
      
      if (!res.ok) {
        throw new Error(`Failed to fetch roles: ${res.status}`)
      }
      
      const data = await res.json()
      setRoles(data)
    } catch (error) {
      console.error('Error fetching roles:', error)
      setError(error instanceof Error ? error.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoleDetail = async (roleId: number): Promise<RoleDetail> => {
    const res = await fetch(`/api/roles/${roleId}`)
    if (!res.ok) throw new Error('Failed to fetch role details')
    return res.json()
  }

  const handleView = async (role: Role) => {
    try {
      const detail = await fetchRoleDetail(role.id)
      setViewRole(detail)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load role details')
    }
  }

  const handleEdit = async (role: Role) => {
    try {
      const detail = await fetchRoleDetail(role.id)
      const alreadyEditing = editingRoles.find(r => r.id === detail.id)
      if (!alreadyEditing) {
        setEditingRoles(prev => [...prev, detail])
      }
      setActiveTab(`edit-${detail.id}`)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load role details')
    }
  }

  const handleCloseEditTab = (roleId: number) => {
    setEditingRoles(prev => prev.filter(r => r.id !== roleId))
    setActiveTab('all')
  }

  const handleSave = async (role: RoleDetail) => {
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: role.name }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to save role')
      }
      
      await fetchRoles()
      handleCloseEditTab(role.id)
      
    } catch (error) {
      console.error('Error saving role:', error)
      alert('Failed to save role')
    }
  }

  const handleAddUser = async (roleId: number, userId: number) => {
    try {
      const res = await fetch(`/api/roles/${roleId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add user')
      }
      
      // Refresh the role detail
      const detail = await fetchRoleDetail(roleId)
      setEditingRoles(prev => prev.map(r => r.id === roleId ? detail : r))
      
    } catch (error) {
      console.error('Error adding user:', error)
      alert(error instanceof Error ? error.message : 'Failed to add user')
    }
  }

  const handleRemoveUser = async (roleId: number, userId: number) => {
    try {
      const res = await fetch(`/api/roles/${roleId}/users?userId=${userId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Failed to remove user')
      }
      
      // Refresh the role detail
      const detail = await fetchRoleDetail(roleId)
      setEditingRoles(prev => prev.map(r => r.id === roleId ? detail : r))
      
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Failed to remove user')
    }
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? This will remove all user associations.`)) {
      return
    }

    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete role')
      }
      
      await fetchRoles()
      alert('Role deleted successfully')
      
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Failed to delete role')
    }
  }

  const handleAddRole = async () => {
    const name = prompt('Enter role name:')
    if (!name || !name.trim()) return

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create role')
      }
      
      await fetchRoles()
      alert('Role created successfully')
      
    } catch (error) {
      console.error('Error creating role:', error)
      alert(error instanceof Error ? error.message : 'Failed to create role')
    }
  }

  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading roles</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchRoles}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const roleListTab = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          All Roles ({roles.length})
        </h3>
        <button 
          onClick={handleAddRole}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Role
        </button>
      </div>
      <RolesTable 
        roles={roles} 
        onView={handleView} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )

  const tabs = [
    { 
      id: 'all', 
      label: 'All Roles', 
      content: roleListTab,
      closeable: false
    },
    ...editingRoles.map(role => ({
      id: `edit-${role.id}`,
      label: role.name,
      content: (
        <RoleEditTab
          role={role}
          onSave={handleSave}
          onCancel={() => handleCloseEditTab(role.id)}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
        />
      ),
      closeable: true,
      onClose: () => handleCloseEditTab(role.id)
    }))
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Roles</h2>
      <p className="text-slate-600 mb-6">Manage user roles and permissions</p>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {viewRole && (
        <RoleView
          role={viewRole}
          onClose={() => setViewRole(null)}
        />
      )}
    </div>
  )
}