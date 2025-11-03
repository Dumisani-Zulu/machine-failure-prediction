'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Gauge, 
  Power, 
  Settings, 
  Thermometer,
  Zap,
  TrendingUp,
  Wrench
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Machine } from "@/types"
import { useToast } from "@/components/ui/use-toast"

// Mock data - same as main machines page
const mockMachines: Machine[] = [
  {
    id: '1',
    name: 'Crusher Unit A1',
    type: 'Crusher',
    status: 'online',
    healthStatus: 'good',
    location: 'Sector A',
    lastMaintenance: '2024-06-15',
    nextMaintenance: '2024-08-15',
    operatingHours: 2847,
    efficiency: 87,
    temperature: 72,
    pressure: 8.5,
    vibration: 2.3
  },
  {
    id: '2',
    name: 'Belt Conveyor B2',
    type: 'Belt Conveyor',
    status: 'online',
    healthStatus: 'excellent',
    location: 'Sector B',
    lastMaintenance: '2024-07-01',
    nextMaintenance: '2024-09-01',
    operatingHours: 1924,
    efficiency: 94,
    temperature: 45,
    pressure: 6.2,
    vibration: 1.1
  },
  {
    id: '3',
    name: 'Excavator X1',
    type: 'Excavator',
    status: 'offline',
    healthStatus: 'critical',
    location: 'Sector C',
    lastMaintenance: '2024-05-20',
    nextMaintenance: '2024-07-20',
    operatingHours: 3642,
    efficiency: 45,
    temperature: 95,
    pressure: 12.8,
    vibration: 4.7
  },
  {
    id: '4',
    name: 'Drill Rig D1',
    type: 'Drill',
    status: 'maintenance',
    healthStatus: 'warning',
    location: 'Sector D',
    lastMaintenance: '2024-07-10',
    nextMaintenance: '2024-09-10',
    operatingHours: 2156,
    efficiency: 72,
    temperature: 68,
    pressure: 9.1,
    vibration: 3.2
  },
  {
    id: '5',
    name: 'Loader L3',
    type: 'Loader',
    status: 'online',
    healthStatus: 'good',
    location: 'Sector A',
    lastMaintenance: '2024-06-25',
    nextMaintenance: '2024-08-25',
    operatingHours: 1789,
    efficiency: 82,
    temperature: 58,
    pressure: 7.4,
    vibration: 2.0
  },
  {
    id: '6',
    name: 'Haul Truck H1',
    type: 'Haul Truck',
    status: 'online',
    healthStatus: 'excellent',
    location: 'Sector B',
    lastMaintenance: '2024-06-30',
    nextMaintenance: '2024-08-30',
    operatingHours: 2398,
    efficiency: 91,
    temperature: 62,
    pressure: 8.9,
    vibration: 1.8
  },
  {
    id: '7',
    name: 'Mill M2',
    type: 'Mill',
    status: 'online',
    healthStatus: 'warning',
    location: 'Sector C',
    lastMaintenance: '2024-05-15',
    nextMaintenance: '2024-07-15',
    operatingHours: 3124,
    efficiency: 78,
    temperature: 84,
    pressure: 10.2,
    vibration: 3.8
  },
  {
    id: '8',
    name: 'Separator S1',
    type: 'Separator',
    status: 'offline',
    healthStatus: 'good',
    location: 'Sector D',
    lastMaintenance: '2024-07-05',
    nextMaintenance: '2024-09-05',
    operatingHours: 1567,
    efficiency: 85,
    temperature: 55,
    pressure: 6.8,
    vibration: 2.1
  }
];

export default function MachineDetail() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [machine, setMachine] = useState<Machine | null>(null);

  useEffect(() => {
    let mounted = true;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const mapBackendToMachine = (data: any) => {
      if (!data) return null;
      // Backend returns vitals under `vitals` with temperature/pressure/vibration
      const vitals = data.vitals || {};
      return {
        id: data.id || params.id,
        name: data.name || `Machine ${params.id}`,
        type: data.type || data.machine_type || 'Unknown',
        status: data.status || 'online',
        healthStatus: data.health_status || 'good',
        location: data.location || '',
        lastMaintenance: data.last_maintenance || data.lastMaintenance || 'N/A',
        nextMaintenance: data.next_maintenance || data.nextMaintenance || 'N/A',
        operatingHours: data.operating_hours || data.operatingHours || 0,
        efficiency: data.efficiency || data.efficiency || 0,
        temperature: vitals.temperature ?? vitals.Temperature ?? data.temperature ?? 0,
        pressure: vitals.pressure ?? vitals.Pressure ?? data.pressure ?? 0,
        vibration: vitals.vibration ?? vitals.Vibration ?? data.vibration ?? 0,
        failure_prediction: data.failure_prediction || {}
      } as Machine;
    }

    const fetchMachine = async () => {
      try {
        const res = await fetch(`http://localhost:5000/machine/machines/${params.id}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = await res.json();
        if (payload && payload.success && payload.data) {
          const mapped = mapBackendToMachine(payload.data);
          if (mounted) setMachine(mapped);
          return;
        }

        // If payload present but indicates failure, show a toast and fallback
        toast({
          title: 'Backend returned no data',
          description: 'Using local sample for this machine.',
          variant: 'warning'
        });
      } catch (err) {
        console.error('Failed to fetch machine details:', err);
        toast({
          title: 'Unable to load machine details',
          description: String(err),
          variant: 'destructive'
        });
      }

      // fallback to local mock if backend fails
      const found = mockMachines.find(m => m.id === params.id) || null;
      if (mounted) setMachine(found);
    }

    // Fetch immediately and then poll every 30s
    fetchMachine();
    pollId = setInterval(fetchMachine, 30_000);

    return () => {
      mounted = false;
      if (pollId) clearInterval(pollId);
    };
  }, [params.id]);

  const handleStatusToggle = () => {
    if (machine) {
      const newStatus: 'online' | 'offline' = machine.status === 'online' ? 'offline' : 'online';
      const updatedMachine: Machine = { ...machine, status: newStatus };
      setMachine(updatedMachine);
      
      toast({
        title: "Machine Status Updated",
        description: `${machine.name} is now ${newStatus}`,
        variant: newStatus === 'online' ? 'default' : 'destructive',
      });
    }
  };

  const handleScheduleMaintenance = () => {
    if (machine) {
      const updatedMachine: Machine = { ...machine, status: 'maintenance' };
      setMachine(updatedMachine);
      
      toast({
        title: "Maintenance Scheduled",
        description: `${machine.name} has been scheduled for maintenance`,
        variant: 'default',
      });
    }
  };

  const handleAnalyzePerformance = () => {
    if (machine) {
      toast({
        title: "Performance Analysis Started",
        description: `Analyzing ${machine.name}... Current efficiency: ${machine.efficiency}%`,
        variant: 'default',
      });
    }
  };

  if (!machine) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Header 
          title="Machine Not Found" 
          breadcrumbs={[
            { label: "Machines", href: "/machines" },
            { label: "Not Found" }
          ]} 
        />
        <Card>
          <CardContent className="pt-6">
            <p>Machine with ID {params.id} not found.</p>
            <Button onClick={() => router.push('/machines')} className="mt-4">
              Back to Machines
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'online': 'success',
      'offline': 'destructive',
      'maintenance': 'secondary'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const getHealthBadge = (health: string) => {
    const variants = {
      'excellent': 'success',
      'good': 'secondary',
      'warning': 'outline',
      'critical': 'destructive'
    } as const;
    return <Badge variant={variants[health as keyof typeof variants] || 'outline'}>{health}</Badge>;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Header 
        title={machine.name} 
        breadcrumbs={[
        { label: "Machines", href: "/machines" },
          { label: machine.name }
        ]} 
      />

      {/* Status Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(machine.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getHealthBadge(machine.healthStatus)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machine.efficiency}%</div>
            <Progress value={machine.efficiency} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machine.operatingHours.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        <Button 
          variant={machine.status === 'online' ? 'destructive' : 'default'}
          onClick={handleStatusToggle}
        >
          <Power className="mr-2 h-4 w-4" />
          {machine.status === 'online' ? 'Take Offline' : 'Bring Online'}
        </Button>
        <Button 
          variant="outline"
          onClick={handleScheduleMaintenance}
        >
          <Wrench className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
        <Button 
          variant="outline"
          onClick={handleAnalyzePerformance}
        >
          <Settings className="mr-2 h-4 w-4" />
          Analyze Performance
        </Button>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sensors">Sensor Data</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Machine Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm">{machine.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{machine.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Operating Hours:</span>
                  <span className="text-sm">{machine.operatingHours.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Efficiency:</span>
                  <span className="text-sm">{machine.efficiency}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Readings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center">
                    <Thermometer className="mr-2 h-4 w-4" />
                    Temperature:
                  </span>
                  <span className="text-sm">{machine.temperature}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center">
                    <Gauge className="mr-2 h-4 w-4" />
                    Pressure:
                  </span>
                  <span className="text-sm">{machine.pressure} bar</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center">
                    <Zap className="mr-2 h-4 w-4" />
                    Vibration:
                  </span>
                  <span className="text-sm">{machine.vibration} mm/s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Sensor Data</CardTitle>
              <CardDescription>Current sensor readings and historical trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Temperature</span>
                    <span className="text-sm">{machine.temperature}°C</span>
                  </div>
                  <Progress value={(machine.temperature / 100) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pressure</span>
                    <span className="text-sm">{machine.pressure} bar</span>
                  </div>
                  <Progress value={(machine.pressure / 10) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Vibration</span>
                    <span className="text-sm">{machine.vibration} mm/s</span>
                  </div>
                  <Progress value={(machine.vibration / 5) * 100} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Last Maintenance:
                  </span>
                  <span className="text-sm">{machine.lastMaintenance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Next Maintenance:
                  </span>
                  <span className="text-sm">{machine.nextMaintenance}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleScheduleMaintenance}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Schedule Preventive Maintenance
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Issue Reported",
                      description: `Issue reported for ${machine.name}. Support team will investigate.`,
                      variant: 'default',
                    });
                  }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
