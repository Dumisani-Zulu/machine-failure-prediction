"use client"

import { useAuth } from "@/contexts/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  
  // Handle redirects based on auth state
  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname?.startsWith('/auth')
      
      if (!isAuthenticated && !isAuthPage) {
        // Not authenticated and not on auth page - redirect to signin
        router.push('/auth/signin')
      } else if (isAuthenticated && isAuthPage) {
        // Authenticated and on auth page - redirect to dashboard
        router.push('/')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])
  
  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If on auth pages, render without sidebar
  const isAuthPage = pathname?.startsWith('/auth')
  
  if (isAuthPage) {
    return <>{children}</>
  }

  // If not authenticated and not on auth page, show loading while redirect happens
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // If authenticated and not on auth page, render with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
