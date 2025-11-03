import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Activity, CreditCard, DollarSign, Users } from "lucide-react"
import { PredictionForm } from "@/components/PredictionForm"
import { StatusPanel } from "@/components/StatusPanel"

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Header title="Machine Learning Dashboard" />
      <div className="grid gap-4">
        <StatusPanel />
        <PredictionForm />
      </div>
    </div>
  )
}
