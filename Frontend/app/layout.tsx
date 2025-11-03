import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { AuthProvider } from "@/contexts/AuthContext"
import { NotificationsProvider } from "@/contexts/NotificationsContext"
import { ConditionalLayout } from "../components/ConditionalLayout"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Machine Failure Prediction | Dashboard",
  description: "A machine failure prediction system that users machine learning to predict the probability of a machine failing based on data from the sensors.",
  generator: 'Dumisani Lesley Zulu'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <NotificationsProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </NotificationsProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}
