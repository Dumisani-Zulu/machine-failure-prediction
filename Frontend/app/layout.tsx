import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ClerkProvider } from '@clerk/nextjs'
import { NotificationsProvider } from "@/contexts/NotificationsContext"
import { ConditionalLayout } from "../components/ConditionalLayout"
import { Toaster } from "@/components/ui/toaster"

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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <NotificationsProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </NotificationsProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
