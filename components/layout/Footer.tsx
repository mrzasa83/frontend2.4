'use client'

import { useState } from 'react'

export default function Footer() {
  const [debugMode, setDebugMode] = useState(false)

  return (
    <div className="h-10 bg-slate-800 text-slate-400 text-xs flex items-center justify-between px-6">
      <span>Version 1.0.0</span>
      {debugMode && (
        <div className="flex gap-4">
          <span>Debug Mode Active</span>
          <span>Response Time: 45ms</span>
          <span>Memory: 128MB</span>
        </div>
      )}
      <button
        onClick={() => setDebugMode(!debugMode)}
        className="text-slate-500 hover:text-slate-300"
      >
        {debugMode ? 'Hide' : 'Show'} Debug
      </button>
    </div>
  )
}