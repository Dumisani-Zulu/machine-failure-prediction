'use client'

import React from "react"
import { Header } from "@/components/header"

export default function MachinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Machines" breadcrumbs={[{ label: "Machines" }]} />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">Mining Machines</h1>
        <p>Loading...</p>
      </div>
    </div>
  )
}
