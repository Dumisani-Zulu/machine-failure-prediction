'use client'

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  AlertTriangle, 
  Play, 
  Square, 
  RefreshCw,
  Thermometer,
  Gauge,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  PowerOff,
  Power
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MachineVitals {
  machine_id: string
  machine_name: string
  machine_type: string
  temperature: number
  pressure: number
  vibration: number
  timestamp: string
  prediction?: {
    failure_risk: number
    predicted_failure_type: string
    estimated_hours: string | number
    risk_level: string
    timestamp: string
  }
  history?: Array<{
    Timestamp: string
    Temperature: number
    Pressure: number
    Vibration: number
  }>
}

interface MachineData {
  id: string
  name: string
  type: string
  status: string
  health_status: string
  location?: string
  description?: string
  vitals: {
    temperature: number
    pressure: number
    vibration: number
    timestamp: string
  }
  failure_prediction?: {
    risk_level: number
    predicted_failure_type: string
    estimated_time_to_failure: string
    maintenance_priority: string
    recommended_action: string
    last_updated: string
  }
}

export default function ImprovedVitalsPage() {
  const { toast } = useToast()
  const [machines, setMachines] = useState<MachineData[]>([])
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [machineVitals, setMachineVitals] = useState<Record<string, MachineVitals>>({})
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch all machines
  const fetchMachines = async () => {
    try {
      const response = await apiClient.getMachines()
      if (response.success) {
        setMachines(response.data)
        if (!selectedMachine && response.data.length > 0) {
          setSelectedMachine(response.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching machines:', error)
    }
  }

  // Fetch vitals for a specific machine
  const fetchMachineVitals = async (machineId: string) => {
    try {
      const [vitalsResponse, historyResponse] = await Promise.all([
        apiClient.getMachineCurrentVitals(machineId),
        apiClient.getMachineVitalsHistory(machineId, 20)
      ])

      if (vitalsResponse.success) {
        setMachineVitals(prev => ({
          ...prev,
          [machineId]: {
            ...vitalsResponse.data,
            history: historyResponse.success ? historyResponse.data : []
          }
        }))
      }
    } catch (error) {
      console.error(`Error fetching vitals for machine ${machineId}:`, error)
    }
  }

  // Fetch vitals for all machines
  const fetchAllMachinesVitals = async () => {
    try {
      setLoading(true)
      await fetchMachines()
      
      const machineIds = machines.length > 0 ? machines.map(m => m.id) : ['1', '2', '3', '4']
      await Promise.all(machineIds.map(id => fetchMachineVitals(id)))
    } catch (error) {
      console.error('Error fetching all machine vitals:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check simulation status
  const checkSimulationStatus = async () => {
    try {
      const response = await apiClient.getSimulationStatus()
      if (response.success) {
        setSimulationRunning(response.data.running)
      }
    } catch (error) {
      console.error('Error checking simulation status:', error)
    }
  }

  // Start simulation
  const startSimulation = async () => {
    try {
      const response = await apiClient.startSimulation()
      if (response.success) {
        setSimulationRunning(true)
        toast({
          title: "Success",
          description: response.message,
        })
        // Immediately fetch updated data
        fetchAllMachinesVitals()
      }
    } catch (error) {
      console.error('Error starting simulation:', error)
      toast({
        title: "Error",
        description: "Failed to start simulation",
        variant: "destructive",
      })
    }
  }

  // Stop simulation
  const stopSimulation = async () => {
    try {
      const response = await apiClient.stopSimulation()
      if (response.success) {
        setSimulationRunning(false)
        toast({
          title: "Success",
          description: response.message,
        })
      }
    } catch (error) {
      console.error('Error stopping simulation:', error)
      toast({
        title: "Error",
        description: "Failed to stop simulation",
        variant: "destructive",
      })
    }
  }

  // Take machine offline
  const takeMachineOffline = async (machineId: string, machineName: string) => {
    try {
      const response = await apiClient.updateMachineStatus(machineId, 'offline')
      if (response.success) {
        toast({
          title: "Machine Taken Offline",
          description: `${machineName} has been taken offline for safety.`,
        })
        // Refresh machine data
        await fetchMachines()
        await fetchMachineVitals(machineId)
      }
    } catch (error) {
      console.error('Error taking machine offline:', error)
      toast({
        title: "Error",
        description: "Failed to take machine offline",
        variant: "destructive",
      })
    }
  }

  // Bring machine back online
  const bringMachineOnline = async (machineId: string, machineName: string) => {
    try {
      const response = await apiClient.updateMachineStatus(machineId, 'online')
      if (response.success) {
        toast({
          title: "Machine Brought Online",
          description: `${machineName} is now online.`,
        })
        // Refresh machine data
        await fetchMachines()
        await fetchMachineVitals(machineId)
      }
    } catch (error) {
      console.error('Error bringing machine online:', error)
      toast({
        title: "Error",
        description: "Failed to bring machine online",
        variant: "destructive",
      })
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
      case 'normal':
        return 'bg-green-500'
      case 'good':
        return 'bg-blue-500'
      case 'warning':
      case 'caution':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get status variant
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
      case 'normal':
      case 'good':
        return 'default'
      case 'warning':
      case 'caution':
        return 'secondary'
      case 'critical':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Get risk badge color
  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'high':
        return 'destructive'
      case 'critical':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Format chart data
  const formatChartData = (history: any[]) => {
    if (!history || history.length === 0) return []
    
    return history.map(reading => ({
      time: new Date(reading.Timestamp).toLocaleTimeString(),
      timestamp: new Date(reading.Timestamp).getTime(),
      temperature: reading.Temperature,
      pressure: reading.Pressure,
      vibration: reading.Vibration
    })).sort((a, b) => a.timestamp - b.timestamp)
  }

  // Initial load
  useEffect(() => {
    checkSimulationStatus()
    fetchAllMachinesVitals()
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && simulationRunning) {
      const interval = setInterval(() => {
        fetchAllMachinesVitals()
      }, 30000) // Refresh every 30 seconds
      
      intervalRef.current = interval
      return () => clearInterval(interval)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [autoRefresh, simulationRunning, machines])

  const currentMachine = machines.find(m => m.id === selectedMachine)
  const currentVitals = selectedMachine ? machineVitals[selectedMachine] : null

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Real-Time Machine Vitals" 
        breadcrumbs={[{ label: "Machine Vitals" }]} 
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Live Machine Monitoring</h1>
              <p className="text-muted-foreground">
                Real-time vitals monitoring with ML-based failure predictions
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh (30s)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAllMachinesVitals()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Now
              </Button>
            </div>
          </div>

          {/* Simulation Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Simulation Controls
              </CardTitle>
              <CardDescription>
                Control the real-time vitals simulation - updates every 30 seconds with ML predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${simulationRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">
                    Status: {simulationRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={startSimulation}
                    disabled={simulationRunning}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Simulation
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopSimulation}
                    disabled={!simulationRunning}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Simulation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Machine Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {machines.map(machine => {
              const vitals = machineVitals[machine.id]
              const isOffline = machine.status === 'offline'
              return (
                <Card 
                  key={machine.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedMachine === machine.id ? 'ring-2 ring-primary' : ''} ${isOffline ? 'opacity-70 border-orange-500' : ''}`}
                  onClick={() => setSelectedMachine(machine.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{machine.name}</CardTitle>
                          {isOffline && <PowerOff className="h-4 w-4 text-orange-600" />}
                        </div>
                        <CardDescription className="text-xs">{machine.type}</CardDescription>
                        {isOffline && (
                          <Badge variant="outline" className="mt-1 text-xs border-orange-500 text-orange-700">
                            OFFLINE
                          </Badge>
                        )}
                      </div>
                      {!isOffline && (
                        <Badge variant={getStatusVariant(machine.health_status) as any}>
                          {machine.health_status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-red-500" />
                          Temp
                        </span>
                        <span className="font-medium">{vitals?.temperature?.toFixed(1) || machine.vitals.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3 w-3 text-blue-500" />
                          Press
                        </span>
                        <span className="font-medium">{vitals?.pressure?.toFixed(1) || machine.vitals.pressure.toFixed(1)} PSI</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-green-500" />
                          Vib
                        </span>
                        <span className="font-medium">{vitals?.vibration?.toFixed(2) || machine.vitals.vibration.toFixed(2)} mm/s</span>
                      </div>
                      {vitals?.prediction && !isOffline && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span>Failure Risk</span>
                            <Badge variant={getRiskBadgeVariant(vitals.prediction.risk_level)}>
                              {vitals.prediction.failure_risk}%
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Selected Machine Details */}
          {currentMachine && currentVitals && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{currentMachine.name} - Detailed View</h2>
                <Badge variant={getStatusVariant(currentMachine.health_status) as any} className="text-sm px-3 py-1">
                  {currentMachine.health_status.toUpperCase()}
                </Badge>
              </div>

              {/* Current Sensor Readings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      Temperature
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{currentVitals.temperature?.toFixed(1)}°C</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date(currentVitals.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-500" />
                      Pressure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{currentVitals.pressure?.toFixed(1)} PSI</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date(currentVitals.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      Vibration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{currentVitals.vibration?.toFixed(2)} mm/s</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date(currentVitals.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* ML Prediction Results */}
              {currentVitals.prediction && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          ML Failure Prediction
                        </CardTitle>
                        <CardDescription>
                          Real-time machine learning prediction based on current vitals
                        </CardDescription>
                      </div>
                      {currentVitals.prediction.failure_risk > 70 && (
                        <div className="flex items-center gap-2">
                          {currentMachine?.status === 'online' ? (
                            <Button
                              variant="destructive"
                              size="lg"
                              onClick={() => takeMachineOffline(currentMachine.id, currentMachine.name)}
                              className="gap-2"
                            >
                              <PowerOff className="h-5 w-5" />
                              Take Machine Offline
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="lg"
                              onClick={() => bringMachineOnline(currentMachine.id, currentMachine.name)}
                              className="gap-2"
                            >
                              <Power className="h-5 w-5" />
                              Bring Back Online
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentVitals.prediction.failure_risk > 90 && currentMachine?.status === 'offline' && (
                      <Alert variant="destructive" className="mb-4 border-red-700 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-700" />
                        <AlertDescription className="text-red-900">
                          <strong>🚨 AUTOMATIC SHUTDOWN:</strong> This machine was automatically taken offline due to critically high failure risk (&gt;90%). 
                          <div className="mt-2 font-semibold">
                            IMMEDIATE MAINTENANCE REQUIRED - Do not restart until inspection is complete.
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {currentVitals.prediction.failure_risk > 70 && currentVitals.prediction.failure_risk <= 90 && currentMachine?.status === 'online' && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Critical Warning:</strong> This machine has a failure risk above 70%. 
                          It is recommended to take it offline immediately to prevent potential damage or safety hazards.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {currentMachine?.status === 'offline' && currentVitals.prediction.failure_risk <= 90 && (
                      <Alert className="mb-4 border-orange-500 bg-orange-50">
                        <PowerOff className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <strong>Machine Offline:</strong> This machine has been taken offline for safety. 
                          Please perform necessary maintenance before bringing it back online.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Failure Risk</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold">{currentVitals.prediction.failure_risk}%</div>
                          <Badge variant={getRiskBadgeVariant(currentVitals.prediction.risk_level)}>
                            {currentVitals.prediction.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Predicted Failure Type</div>
                        <div className="font-medium">{currentVitals.prediction.predicted_failure_type.replace(/_/g, ' ').toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Estimated Time to Failure</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{currentVitals.prediction.estimated_hours} hours</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Last Prediction</div>
                        <div className="text-sm">{new Date(currentVitals.prediction.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historical Charts */}
              {currentVitals.history && currentVitals.history.length > 0 && (
                <Tabs defaultValue="temperature" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="temperature">Temperature</TabsTrigger>
                    <TabsTrigger value="pressure">Pressure</TabsTrigger>
                    <TabsTrigger value="vibration">Vibration</TabsTrigger>
                  </TabsList>

                  <TabsContent value="temperature">
                    <Card>
                      <CardHeader>
                        <CardTitle>Temperature History</CardTitle>
                        <CardDescription>Last {currentVitals.history.length} readings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formatChartData(currentVitals.history)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" fontSize={12} />
                              <YAxis fontSize={12} />
                              <Tooltip />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="temperature" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                name="Temperature (°C)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="pressure">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pressure History</CardTitle>
                        <CardDescription>Last {currentVitals.history.length} readings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formatChartData(currentVitals.history)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" fontSize={12} />
                              <YAxis fontSize={12} />
                              <Tooltip />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="pressure" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Pressure (PSI)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="vibration">
                    <Card>
                      <CardHeader>
                        <CardTitle>Vibration History</CardTitle>
                        <CardDescription>Last {currentVitals.history.length} readings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formatChartData(currentVitals.history)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" fontSize={12} />
                              <YAxis fontSize={12} />
                              <Tooltip />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="vibration" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="Vibration (mm/s)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
