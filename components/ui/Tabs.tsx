'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface Tab {
  id: string
  label: string | ReactNode
  content: ReactNode
  closeable?: boolean
  onClose?: () => void
}

interface TabsProps {
  tabs: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  const currentTab = activeTab || tabs[0]?.id
  const activeContent = tabs.find(tab => tab.id === currentTab)?.content

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  const handleClose = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation()
    if (tab.onClose) {
      tab.onClose()
    }
  }

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap cursor-pointer ${
                currentTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.closeable && (
                <button
                  onClick={(e) => handleClose(e, tab)}
                  className="hover:bg-slate-200 rounded p-0.5 transition-colors"
                  title="Close tab"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeContent}
      </div>
    </div>
  )
}