'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Power, 
  Settings, 
  Wrench,
  TrendingUp,
  TrendingDown,
  Zap,
  Gauge,
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Thermometer,
  BarChart3
} from "lucide-react"
import { MachineType } from "@/types"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Machine icons mapping
const MachineIcons = {
  'Haul Truck': '🚛',
  'Drill Rig': '🔧',
  'Shovel/Excavator': '🚜',
  'Crusher': '⚙️'
}

// Machine data interface
interface MachineData {
  id: string;
  name: string;
  type: MachineType;
  status: 'online' | 'offline' | 'maintenance';
  location: string;
  description: string;
  health_status: 'excellent' | 'good' | 'warning' | 'critical';
  vitals: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
  operating_hours: number;
  efficiency: number;
  last_maintenance: string;
  next_maintenance: string;
  failure_prediction: {
    risk_level: number;
    predicted_failure_type: string;
    failure_description: string;
    estimated_time_to_failure: string;
    confidence: number;
    maintenance_priority: string;
    recommended_action: string;
  };
  common_failures: string[];
  _live?: boolean;
}

export default function MiningDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState(true);

  // Local fallback machines (displayed if backend returns empty or is unreachable)
  const FALLBACK_MACHINES: MachineData[] = [
    {
      id: '1',
      name: 'Haul Truck HT-001',
      type: 'Haul Truck',
      status: 'online',
      location: 'Pit Area A',
      description: 'Used for transporting ore and waste',
      health_status: 'good',
      vitals: { temperature: 65, pressure: 110, vibration: 1.5 },
      operating_hours: 2500,
      efficiency: 88,
      last_maintenance: '2024-07-15',
      next_maintenance: '2024-09-15',
      failure_prediction: {
        risk_level: 35,
        predicted_failure_type: 'tire_wear',
        failure_description: 'Excessive tire wear requiring replacement',
        estimated_time_to_failure: '120 hours',
        confidence: 80,
        maintenance_priority: 'medium',
        recommended_action: 'Monitor closely and schedule preventive maintenance'
      },
      common_failures: ['engine_breakdown', 'hydraulic_leak', 'tire_wear', 'transmission_fault']
    },
    {
      id: '2',
      name: 'Drill Rig DR-002',
      type: 'Drill Rig',
      status: 'online',
      location: 'Blast Zone B',
      description: 'Essential for drilling blast holes',
      health_status: 'good',
      vitals: { temperature: 70, pressure: 120, vibration: 2.0 },
      operating_hours: 3200,
      efficiency: 85,
      last_maintenance: '2024-07-15',
      next_maintenance: '2024-09-15',
      failure_prediction: {
        risk_level: 40,
        predicted_failure_type: 'drill_bit_wear',
        failure_description: 'Drill bit requires replacement due to wear',
        estimated_time_to_failure: '96 hours',
        confidence: 78,
        maintenance_priority: 'medium',
        recommended_action: 'Monitor closely and schedule preventive maintenance'
      },
      common_failures: ['drill_bit_wear', 'hydraulic_system_failure', 'motor_fault']
    },
    {
      id: '3',
      name: 'Shovel EX-003',
      type: 'Shovel/Excavator',
      status: 'online',
      location: 'Loading Area C',
      description: 'Used for loading ore into haul trucks',
      health_status: 'good',
      vitals: { temperature: 68, pressure: 105, vibration: 1.2 },
      operating_hours: 2800,
      efficiency: 90,
      last_maintenance: '2024-07-15',
      next_maintenance: '2024-09-15',
      failure_prediction: {
        risk_level: 30,
        predicted_failure_type: 'bucket_arm_wear',
        failure_description: 'Bucket or arm structural wear',
        estimated_time_to_failure: '144 hours',
        confidence: 75,
        maintenance_priority: 'low',
        recommended_action: 'Continue normal operations'
      },
      common_failures: ['hydraulic_pump_failure', 'bucket_arm_wear', 'electrical_issue']
    },
    {
      id: '4',
      name: 'Crusher CR-004',
      type: 'Crusher',
      status: 'online',
      location: 'Processing Plant D',
      description: 'Used to break down mined ore',
      health_status: 'good',
      vitals: { temperature: 75, pressure: 130, vibration: 2.3 },
      operating_hours: 4000,
      efficiency: 82,
      last_maintenance: '2024-07-15',
      next_maintenance: '2024-09-15',
      failure_prediction: {
        risk_level: 50,
        predicted_failure_type: 'liner_wear',
        failure_description: 'Crushing liner wear requiring replacement',
        estimated_time_to_failure: '48 hours',
        confidence: 70,
        maintenance_priority: 'high',
        recommended_action: 'Schedule maintenance in next 24 hours'
      },
      common_failures: ['bearing_failure', 'liner_wear', 'motor_overheating', 'conveyor_jam']
    }
  ];

  // Fetch machines data
  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/machine/machines');

      // If non-OK status, treat as failure
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Try to parse JSON; if parsing fails we'll fallback
      let data: any = null;
      try {
        data = await res.json();
      } catch (parseError) {
        console.warn('Non-JSON response from backend:', parseError);
        // Non-JSON -> fallback to sample machines
        setMachines(FALLBACK_MACHINES.map(m => ({ ...m, _live: false })));
        toast({
          title: 'Backend returned unexpected response',
          description: 'Showing local sample machines while backend data is unavailable.',
          variant: 'warning'
        });
        return;
      }

      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        const live = data.data.map((m: any) => ({ ...m, _live: true }));
        setMachines(live);
        return;
      }

      // Backend returned an empty list or success=false
      setMachines(FALLBACK_MACHINES.map(m => ({ ...m, _live: false })));
      toast({ title: 'No machines returned', description: 'Using local fallback machines.', variant: 'warning' });
    } catch (err) {
      console.error('Error fetching machines:', err);
      setMachines(FALLBACK_MACHINES.map(m => ({ ...m, _live: false })));
      toast({ title: 'Failed to refresh machines', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const totalMachines = machines.length;
  const onlineMachines = machines.filter(m => m.status === 'online').length;
  const criticalMachines = machines.filter(m => m.health_status === 'critical').length;
  const avgEfficiency = machines.length > 0 
    ? Math.round(machines.reduce((sum, m) => sum + m.efficiency, 0) / totalMachines)
    : 0;

  const getStatusBadge = (status: string) => {
    const variants = {
      'online': 'default',
      'offline': 'destructive',
      'maintenance': 'secondary'
    } as const;
    
    const icons = {
      'online': <CheckCircle className="h-3 w-3" />,
      'offline': <XCircle className="h-3 w-3" />,
      'maintenance': <Settings className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="flex items-center gap-1">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const getHealthBadge = (health: string) => {
    const variants = {
      'excellent': 'default',
      'good': 'secondary',
      'warning': 'outline',
      'critical': 'destructive'
    } as const;
    
    const colors = {
      'excellent': 'text-green-600',
      'good': 'text-blue-600',
      'warning': 'text-yellow-600',
      'critical': 'text-red-600'
    };

    return (
      <Badge variant={variants[health as keyof typeof variants] || 'outline'} 
             className={`${colors[health as keyof typeof colors]} flex items-center gap-1`}>
        <Shield className="h-3 w-3" />
        {health}
      </Badge>
    );
  };

  const getRiskLevelColor = (riskLevel: number) => {
    if (riskLevel >= 80) return 'text-red-600 bg-red-50';
    if (riskLevel >= 60) return 'text-orange-600 bg-orange-50';
    if (riskLevel >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLevelText = (riskLevel: number) => {
    if (riskLevel >= 80) return 'Critical';
    if (riskLevel >= 60) return 'High';
    if (riskLevel >= 40) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Mining Dashboard" />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading machine data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Mining Dashboard" />
      <div className="container mx-auto p-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mining Equipment Dashboard</h1>
          <p className="text-gray-600">Monitor and predict failures for 4 critical mining machines</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMachines}</div>
              <p className="text-xs text-muted-foreground">Active mining equipment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlineMachines}</div>
              <p className="text-xs text-muted-foreground">Currently operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalMachines}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgEfficiency}%</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button onClick={fetchMachines} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Machine Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {machines.map((machine) => (
            <Card key={machine.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="text-2xl">{MachineIcons[machine.type]}</div>
                    <div>
                      <CardTitle className="text-lg">{machine.name}</CardTitle>
                      <CardDescription>{machine.type} - {machine.location}</CardDescription>
                    </div>
                  </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(machine.status)}
                      {getHealthBadge(machine.health_status)}
                      {/* Live / Fallback indicator */}
                      <div>
                        {machine._live ? (
                          <Badge variant="outline" className="text-green-600">Live</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-600">Fallback</Badge>
                        )}
                      </div>
                    </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Machine Description */}
                <p className="text-sm text-gray-600">{machine.description}</p>

                {/* Vitals */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Thermometer className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <div className="text-lg font-semibold text-blue-900">{machine.vitals.temperature.toFixed(1)}°C</div>
                    <div className="text-xs text-blue-600">Temperature</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Gauge className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <div className="text-lg font-semibold text-green-900">{machine.vitals.pressure.toFixed(1)} PSI</div>
                    <div className="text-xs text-green-600">Pressure</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Activity className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <div className="text-lg font-semibold text-purple-900">{machine.vitals.vibration.toFixed(1)} mm/s</div>
                    <div className="text-xs text-purple-600">Vibration</div>
                  </div>
                </div>

                {/* Failure Prediction */}
                <div className={`p-4 rounded-lg ${getRiskLevelColor(machine.failure_prediction.risk_level)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Failure Prediction</h4>
                    <Badge variant="outline" className={getRiskLevelColor(machine.failure_prediction.risk_level)}>
                      {getRiskLevelText(machine.failure_prediction.risk_level)} Risk
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Risk Level:</span>
                      <span className="font-semibold">{machine.failure_prediction.risk_level}%</span>
                    </div>
                    <Progress value={machine.failure_prediction.risk_level} className="h-2" />
                    <div className="text-sm">
                        <strong>Predicted Failure:</strong> {machine.failure_prediction.predicted_failure_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {machine.failure_prediction.failure_description}
                    </div>
                    <div className="text-sm pt-2">
                      <strong>Maintenance Priority:</strong> {machine.failure_prediction.maintenance_priority}
                    </div>
                    <div className="text-xs text-gray-700">
                      <strong>Recommended Action:</strong> {machine.failure_prediction.recommended_action}
                    </div>
                    <div className="text-sm">
                      <strong>Est. Time to Failure:</strong> {machine.failure_prediction.estimated_time_to_failure}
                    </div>
                    <div className="text-xs">
                      <strong>Confidence:</strong> {machine.failure_prediction.confidence}%
                    </div>
                  </div>
                </div>

                {/* Common Failures */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Common Failure Types:</h4>
                  <div className="flex flex-wrap gap-1">
                    {machine.common_failures.map((failure, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {failure.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Operating Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <div className="text-sm text-gray-600">Operating Hours</div>
                    <div className="font-semibold">{machine.operating_hours.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                    <div className="font-semibold">{machine.efficiency}%</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/machines/${machine.id}`)}
                    className="flex-1"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Maintenance Scheduled",
                        description: `Maintenance for ${machine.name} has been scheduled`,
                      });
                    }}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No data message */}
        {machines.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No machines found</h3>
            <p className="text-gray-600 mb-4">Unable to load machine data. Please check the backend connection.</p>
            <Button onClick={fetchMachines} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
