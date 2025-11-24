'use client'

import React, { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import TopBar from '@/components/layout/TopBar'
import SideNav from '@/components/layout/SideNav'
import Footer from '@/components/layout/Footer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sideNavOpen, setSideNavOpen] = useState(true)

  return (
    <SessionProvider>
      <div className="h-screen flex flex-col">
        <TopBar />
        
        <div className="flex-1 flex overflow-hidden">
          <SideNav 
            isOpen={sideNavOpen} 
            onToggle={() => setSideNavOpen(!sideNavOpen)} 
          />
          
          <main className="flex-1 overflow-auto bg-slate-50">
            {children}
          </main>
        </div>
        
        <Footer />
      </div>
    </SessionProvider>
  )
}