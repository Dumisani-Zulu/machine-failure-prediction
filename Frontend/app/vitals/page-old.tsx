'use client'

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Play, 
  Square, 
  RefreshCw,
  Thermometer,
  Gauge,
  Zap,
  TrendingUp,
  TrendingDown,
  Download,
  Trash2,
  AlertCircle,
  Shield,
  Timer,
  RotateCcw
} from "lucide-react"
import { MachineVitals } from "@/types"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SensorRanges {
  [key: string]: {
    normal: { min: number; max: number }
    caution: { min: number; max: number }
    critical: { min: number; max: number }
    unit: string
  }
}

interface SimulationStatus {
  simulation_running: boolean
  current_mode: string
  forced_mode: string | null
  mode_remaining_seconds: number
  current_readings: any
}

export default function MachineVitalsPage() {
  const { toast } = useToast()
  const [currentVitals, setCurrentVitals] = useState<MachineVitals | null>(null)
  const [vitalsHistory, setVitalsHistory] = useState<MachineVitals[]>([])
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [sensorRanges, setSensorRanges] = useState<SensorRanges>({})
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch sensor ranges
  const fetchSensorRanges = async () => {
    try {
      const response = await fetch('http://localhost:5000/machine/vitals/ranges')
      const data = await response.json()
      if (data.success) {
        setSensorRanges(data.data)
      }
    } catch (error) {
      console.error('Error fetching sensor ranges:', error)
    }
  }

  // Fetch simulation status
  const fetchSimulationStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/machine/vitals/status')
      const data = await response.json()
      if (data.success) {
        setSimulationStatus(data.data)
        setSimulationRunning(data.data.simulation_running)
        setCurrentVitals(data.data.current_readings)
      }
    } catch (error) {
      console.error('Error fetching simulation status:', error)
    }
  }

  // Fetch current vitals
  const fetchCurrentVitals = async () => {
    try {
      const response = await apiClient.getCurrentVitals()
      if (response.success) {
        setCurrentVitals(response.data)
      }
    } catch (error) {
      console.error('Error fetching current vitals:', error)
      toast({
        title: "Error",
        description: "Failed to fetch current vitals",
        variant: "destructive",
      })
    }
  }

  // Trigger caution mode
  const triggerCautionMode = async () => {
    try {
      const response = await fetch('http://localhost:5000/machine/vitals/trigger-caution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 300 }) // 5 minutes
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Caution Mode Triggered",
          description: data.message,
          variant: "default",
        })
        fetchSimulationStatus()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error triggering caution mode:', error)
      toast({
        title: "Error",
        description: "Failed to trigger caution mode",
        variant: "destructive",
      })
    }
  }

  // Trigger critical mode
  const triggerCriticalMode = async () => {
    try {
      const response = await fetch('http://localhost:5000/machine/vitals/trigger-critical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 180 }) // 3 minutes
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Critical Mode Triggered",
          description: data.message,
          variant: "destructive",
        })
        fetchSimulationStatus()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error triggering critical mode:', error)
      toast({
        title: "Error",
        description: "Failed to trigger critical mode",
        variant: "destructive",
      })
    }
  }

  // Reset to normal mode
  const resetToNormal = async () => {
    try {
      const response = await fetch('http://localhost:5000/machine/vitals/reset-normal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Reset to Normal",
          description: data.message,
          variant: "default",
        })
        fetchSimulationStatus()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error resetting to normal:', error)
      toast({
        title: "Error",
        description: "Failed to reset to normal mode",
        variant: "destructive",
      })
    }
  }

  // Fetch vitals history
  const fetchVitalsHistory = async (limit: number = 50) => {
    try {
      setLoading(true);
      const response = await apiClient.getVitalsHistory(limit);
      console.log('Raw vitals history data:', response.data); // Log raw data from backend
      if (response.success) {
        setVitalsHistory(response.data);
      }
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vitals history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  // Clear logs
  const clearLogs = async () => {
    try {
      const response = await apiClient.clearVitalsLogs()
      if (response.success) {
        setVitalsHistory([])
        toast({
          title: "Success",
          description: response.message,
        })
      }
    } catch (error) {
      console.error('Error clearing logs:', error)
      toast({
        title: "Error",
        description: "Failed to clear logs",
        variant: "destructive",
      })
    }
  }

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setAutoRefresh(false)
    } else {
      intervalRef.current = setInterval(() => {
        fetchCurrentVitals()
        fetchVitalsHistory()
      }, 5000) // Refresh every 5 seconds
      setAutoRefresh(true)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500'
      case 'caution':
        return 'bg-yellow-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get status variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'normal':
        return 'default'
      case 'caution':
        return 'secondary'
      case 'warning':
        return 'secondary'
      case 'critical':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Get sensor status for individual sensors
  const getSensorStatus = (sensorType: string, value: number) => {
    const ranges = sensorRanges[sensorType]
    if (!ranges) return 'normal'
    
    if (value >= ranges.critical.min) return 'critical'
    if (value >= ranges.caution.min && value <= ranges.caution.max) return 'caution'
    if (value >= ranges.normal.min && value <= ranges.normal.max) return 'normal'
    return 'critical' // Below normal range
  }

  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format chart data
  const formatChartData = () => {
    return vitalsHistory.slice(-20).map((vital, index) => {
      try {
        const date = vital.timestamp ? new Date(vital.timestamp) : new Date();
        console.log('Raw timestamp:', vital.timestamp, 'Parsed date:', date);
        const formattedTime = date instanceof Date && !isNaN(date.getTime())
          ? date.toISOString() // Store as ISO string for consistent parsing
          : new Date().toISOString();

        // Handle both object format and direct number format
        const getValueFromField = (field: any) => {
          if (typeof field === 'number') return field;
          if (field && typeof field === 'object' && 'value' in field) return field.value;
          return 0;
        };

        return {
          time: formattedTime,
          timestamp: date.getTime(), // Add timestamp for sorting
          temperature: getValueFromField(vital.temperature),
          pressure: getValueFromField(vital.pressure),
          vibration: getValueFromField(vital.vibration),
        };
      } catch (error) {
        console.error('Error formatting date:', vital.timestamp, error);
        return {
          time: new Date().toISOString(),
          timestamp: Date.now(),
          temperature: 0,
          pressure: 0,
          vibration: 0,
        };
      }
    }).sort((a, b) => a.timestamp - b.timestamp); // Ensure correct chronological order
  }

  // Initial load
  useEffect(() => {
    fetchSensorRanges()
    checkSimulationStatus()
    fetchCurrentVitals()
    fetchVitalsHistory()
    fetchSimulationStatus()
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSimulationStatus()
        fetchVitalsHistory()
      }, 5000) // Refresh every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Machine Vitals" 
        breadcrumbs={[{ label: "Machine Vitals" }]} 
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Machine Vitals Monitor</h1>
              <p className="text-muted-foreground">
                Real-time monitoring of machine temperature, pressure, and vibration
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={toggleAutoRefresh}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchVitalsHistory()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
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
                Control machine vitals simulation and trigger different operating modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Basic Simulation</h4>
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
                        Start
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={stopSimulation}
                        disabled={!simulationRunning}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearLogs}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Logs
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mode Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Operating Mode Controls</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={triggerCautionMode}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Trigger Caution
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={triggerCriticalMode}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Trigger Critical
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToNormal}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Normal
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Mode Status */}
              {simulationStatus && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Current Mode:</span>
                      <Badge variant={getStatusVariant(simulationStatus.current_mode)}>
                        {simulationStatus.current_mode.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {simulationStatus.forced_mode && simulationStatus.mode_remaining_seconds > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>Remaining: {formatRemainingTime(simulationStatus.mode_remaining_seconds)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {currentVitals?.temperature?.value?.toFixed(1) || '--'}°C
                    </div>
                    {currentVitals?.temperature && (
                      <Badge variant={getStatusVariant(getSensorStatus('temperature', currentVitals.temperature.value))}>
                        {getSensorStatus('temperature', currentVitals.temperature.value).toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {sensorRanges.temperature && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Normal: {sensorRanges.temperature.normal.min}-{sensorRanges.temperature.normal.max}°C</div>
                      <div>Caution: {sensorRanges.temperature.caution.min}-{sensorRanges.temperature.caution.max}°C</div>
                      <div>Critical: ≥{sensorRanges.temperature.critical.min}°C</div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Last updated: {currentVitals?.temperature?.timestamp ? new Date(currentVitals.temperature.timestamp).toLocaleTimeString() : '--'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pressure Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pressure</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {currentVitals?.pressure?.value?.toFixed(1) || '--'} PSI
                    </div>
                    {currentVitals?.pressure && (
                      <Badge variant={getStatusVariant(getSensorStatus('pressure', currentVitals.pressure.value))}>
                        {getSensorStatus('pressure', currentVitals.pressure.value).toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {sensorRanges.pressure && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Normal: {sensorRanges.pressure.normal.min}-{sensorRanges.pressure.normal.max} PSI</div>
                      <div>Caution: {sensorRanges.pressure.caution.min}-{sensorRanges.pressure.caution.max} PSI</div>
                      <div>Critical: ≥{sensorRanges.pressure.critical.min} PSI</div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Last updated: {currentVitals?.pressure?.timestamp ? new Date(currentVitals.pressure.timestamp).toLocaleTimeString() : '--'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vibration Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vibration</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {currentVitals?.vibration?.value?.toFixed(2) || '--'} mm/s
                    </div>
                    {currentVitals?.vibration && (
                      <Badge variant={getStatusVariant(getSensorStatus('vibration', currentVitals.vibration.value))}>
                        {getSensorStatus('vibration', currentVitals.vibration.value).toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {sensorRanges.vibration && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Normal: {sensorRanges.vibration.normal.min}-{sensorRanges.vibration.normal.max} mm/s</div>
                      <div>Caution: {sensorRanges.vibration.caution.min}-{sensorRanges.vibration.caution.max} mm/s</div>
                      <div>Critical: ≥{sensorRanges.vibration.critical.min} mm/s</div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Last updated: {currentVitals?.vibration?.timestamp ? new Date(currentVitals.vibration.timestamp).toLocaleTimeString() : '--'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Status Alert */}
          {currentVitals?.overall_status && currentVitals.overall_status !== 'normal' && (
            <Alert variant={currentVitals.overall_status === 'critical' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{currentVitals.overall_status === 'critical' ? 'CRITICAL ALERT' : 'CAUTION WARNING'}:</strong>
                {' '}One or more sensors are operating outside normal parameters. 
                {currentVitals.overall_status === 'critical' && ' Immediate attention required!'}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Card */}
          {currentVitals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(currentVitals.overall_status || currentVitals.status || 'normal') as any}>
                    {(currentVitals.overall_status || currentVitals.status || 'normal').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Machine is operating in {currentVitals.overall_status || currentVitals.status || 'normal'} conditions
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          {vitalsHistory.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              {/* Temperature Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    Temperature History
                  </CardTitle>
                  <CardDescription>
                    Temperature readings over time (°C)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="80%">
                      <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tickFormatter={(timeStr) => {
                            const date = new Date(timeStr);
                            return date instanceof Date && !isNaN(date.getTime())
                              ? date.toLocaleTimeString()
                              : timeStr;
                          }}
                        />
                        <YAxis 
                          fontSize={12}
                          label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value}°C`, 'Temperature']}
                          labelFormatter={(timeStr) => {
                            const date = new Date(timeStr);
                            return date instanceof Date && !isNaN(date.getTime())
                              ? `Time: ${date.toLocaleTimeString()}`
                              : `Time: ${timeStr}`;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pressure Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-blue-500" />
                    Pressure History
                  </CardTitle>
                  <CardDescription>
                    Pressure readings over time (PSI)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="80%">
                      <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tickFormatter={(timeStr) => {
                            const date = new Date(timeStr);
                            return date instanceof Date && !isNaN(date.getTime())
                              ? date.toLocaleTimeString()
                              : timeStr;
                          }}
                        />
                        <YAxis 
                          fontSize={12}
                          label={{ value: 'Pressure (PSI)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} PSI`, 'Pressure']}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="pressure"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Vibration Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-500" />
                    Vibration History
                  </CardTitle>
                  <CardDescription>
                    Vibration readings over time (mm/s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="80%">
                      <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tickFormatter={(timeStr) => {
                            const date = new Date(timeStr);
                            return date instanceof Date && !isNaN(date.getTime())
                              ? date.toLocaleTimeString()
                              : timeStr;
                          }}
                        />
                        <YAxis 
                          fontSize={12}
                          label={{ value: 'Vibration (mm/s)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} mm/s`, 'Vibration']}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="vibration"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Vitals Log</CardTitle>
              <CardDescription>
                Latest {vitalsHistory.length} readings from the log file
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vitalsHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No vitals data available. Start the simulation to begin logging data.
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {vitalsHistory.slice(-10).reverse().map((vital, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant={getStatusVariant(vital.status || vital.overall_status || 'normal') as any}>
                          {(vital.status || vital.overall_status || 'normal').toUpperCase()}
                        </Badge>
                        <div className="text-sm">
                          <div className="font-medium">
                            {vital.timestamp ? new Date(vital.timestamp).toLocaleString() : 'Invalid Date'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>🌡️ {(vital.temperature?.value || vital.temperature || 0).toFixed(1)}°C</span>
                        <span>📊 {(vital.pressure?.value || vital.pressure || 0).toFixed(1)} PSI</span>
                        <span>⚡ {(vital.vibration?.value || vital.vibration || 0).toFixed(2)} mm/s</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
