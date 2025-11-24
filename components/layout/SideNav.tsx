'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, Package, Users, Settings, Cog, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

type SubModule = {
  id: string
  name: string
  path: string
  adminOnly?: boolean
}

type Module = {
  id: string
  name: string
  icon: any
  path?: string
  subModules?: SubModule[]
}

const modules: Module[] = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: Home, 
    path: '/dashboard' 
  },
  { 
    id: 'products', 
    name: 'Product', 
    icon: Package,
    subModules: [
      { id: 'products-list', name: 'Products', path: '/products' },
      { id: 'documents', name: 'Documents', path: '/products/documents' },
      { id: 'changes', name: 'Changes', path: '/products/changes' }
    ]
  },
  { 
    id: 'process', 
    name: 'Process', 
    icon: Cog, 
    subModules: [
      { id: 'process-list', name: 'Processes', path: '/process' },
      { id: 'department-list', name: 'Department', path: '/process/department-list' },
      { id: 'processsequence-list', name: 'Process Sequences', path: '/process/sequence-list' }
    ]
  },
  { 
    id: 'users', 
    name: 'User', 
    icon: Users,
    subModules: [
      { id: 'users-list', name: 'Users', path: '/users' },
      { id: 'roles', name: 'Roles', path: '/users/roles', adminOnly: true }
    ]
  },
  { 
    id: 'admin', 
    name: 'Admin', 
    icon: Settings,
    subModules: [
      { id: 'admin-dashboard', name: 'Dashboard', path: '/admin' },
      { id: 'import-parts', name: 'Import Parts', path: '/admin/import-parts' },
      { id: 'sync-parts', name: 'Sync Parts', path: '/admin/sync-parts' },
      { id: 'sql-query', name: 'SQL Query', path: '/admin/sql-query' }
    ]
  }
]

export default function SideNav({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['products', 'users', 'admin']))

  const isAdmin = session?.user?.roles?.includes('admin') || false

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  return (
    <div
      className={`bg-slate-900 text-white transition-all duration-300 flex-shrink-0 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        <button
          onClick={onToggle}
          className="p-4 hover:bg-slate-800 transition-colors flex items-center justify-center"
        >
          {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {modules.map((module) => {
              const Icon = module.icon
              const hasSubModules = module.subModules && module.subModules.length > 0
              const isExpanded = expandedModules.has(module.id)
              const isActive = module.path 
                ? pathname.startsWith(module.path)
                : module.subModules?.some(sub => pathname.startsWith(sub.path))
              
              // Filter sub-modules based on admin status
              const visibleSubModules = module.subModules?.filter(sub => 
                !sub.adminOnly || isAdmin
              )
              
              return (
                <li key={module.id}>
                  {/* Main Module */}
                  {hasSubModules ? (
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                      title={!isOpen ? module.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        {isOpen && <span>{module.name}</span>}
                      </div>
                      {isOpen && (
                        isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={module.path!}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                      title={!isOpen ? module.name : undefined}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {isOpen && <span>{module.name}</span>}
                    </Link>
                  )}

                  {/* Sub Modules */}
                  {hasSubModules && isExpanded && isOpen && visibleSubModules && visibleSubModules.length > 0 && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {visibleSubModules.map((subModule) => {
                        const isSubActive = pathname === subModule.path
                        return (
                          <li key={subModule.id}>
                            <Link
                              href={subModule.path}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                                isSubActive
                                  ? 'bg-blue-500 text-white'
                                  : 'hover:bg-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="w-1 h-1 rounded-full bg-current" />
                              {subModule.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}