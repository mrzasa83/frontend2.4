import Link from 'next/link'
import { FileInput, Database, GitCompare, Terminal } from 'lucide-react'

export default function AdminPage() {
  const adminTools = [
    {
      title: 'Import Parts',
      description: 'Scan network drive and import parts from folder structure',
      icon: FileInput,
      href: '/admin/import-parts',
      color: 'blue'
    },
    {
      title: 'Sync Parts',
      description: 'Compare folder data with database and sync differences',
      icon: GitCompare,
      href: '/admin/sync-parts',
      color: 'orange'
    },
    {
      title: 'SQL Query Tool',
      description: 'Execute queries against connected databases',
      icon: Terminal,
      href: '/admin/sql-query',
      color: 'green'
    },
    {
      title: 'Database Management',
      description: 'Manage database connections and run maintenance tasks',
      icon: Database,
      href: '/admin/database',
      color: 'purple',
      disabled: true
    }
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin</h2>
      <p className="text-slate-600 mb-6">System administration and management tools</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminTools.map((tool) => {
          const Icon = tool.icon
          const isDisabled = tool.disabled

          const card = (
            <div
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg bg-${tool.color}-100 flex items-center justify-center mb-4`}>
                <Icon className={`text-${tool.color}-600`} size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {tool.title}
                {isDisabled && (
                  <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                    Coming Soon
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-600">{tool.description}</p>
            </div>
          )

          if (isDisabled) {
            return <div key={tool.title}>{card}</div>
          }

          return (
            <Link key={tool.title} href={tool.href}>
              {card}
            </Link>
          )
        })}
      </div>
    </div>
  )
}