// API client for machine learning backend
import { PredictionRequest, PredictionResponse, ApiError, Machine, MachineVitals } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.error);
    }
    
    return response.json();
  }

  async testConnection(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/`);
    return this.handleResponse(response);
  }

  async predict(data: PredictionRequest): Promise<PredictionResponse> {
    // Transform frontend data format to backend expected format
    // Backend expects array of objects with capital field names and 3+ records for rolling features
    const backendData = [
      {
        Timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        Temperature: data.temperature,
        Vibration: data.vibration,
        Pressure: data.pressure
      },
      {
        Timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        Temperature: data.temperature + Math.random() * 2 - 1, // Slight variation
        Vibration: data.vibration + Math.random() * 0.1 - 0.05,
        Pressure: data.pressure + Math.random() * 5 - 2.5
      },
      {
        Timestamp: new Date().toISOString(), // Current time
        Temperature: data.temperature,
        Vibration: data.vibration,
        Pressure: data.pressure
      }
    ];

    const response = await fetch(`${this.baseUrl}/ml/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });
    
    return this.handleResponse(response);
  }

  // Machine API methods
  async getMachines(): Promise<{ success: boolean; data: Machine[]; count: number }> {
    const response = await fetch(`${this.baseUrl}/machine/machines`);
    return this.handleResponse(response);
  }

  async getMachine(id: string): Promise<{ success: boolean; data: Machine }> {
    const response = await fetch(`${this.baseUrl}/machine/machines/${id}`);
    return this.handleResponse(response);
  }

  async getMachineCurrentVitals(id: string): Promise<{ success: boolean; data: any }> {
    const response = await fetch(`${this.baseUrl}/machine/machines/${id}/vitals/current`);
    return this.handleResponse(response);
  }

  async getMachineVitalsHistory(id: string, limit?: number): Promise<{ success: boolean; data: any[]; count: number }> {
    const url = `${this.baseUrl}/machine/machines/${id}/vitals/history${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  async updateMachineStatus(id: string, status: 'online' | 'offline' | 'maintenance'): Promise<{ success: boolean; message: string; data: any }> {
    const response = await fetch(`${this.baseUrl}/machine/machines/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return this.handleResponse(response);
  }

  async scheduleMaintenance(id: string, date: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/machines/${id}/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scheduledDate: date }),
    });
    return this.handleResponse(response);
  }

  async analyzeMachine(id: string): Promise<PredictionResponse> {
    const response = await fetch(`${this.baseUrl}/machines/${id}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse(response);
  }

  // Machine Vitals API methods
  async getCurrentVitals(): Promise<{ success: boolean; data: MachineVitals }> {
    const response = await fetch(`${this.baseUrl}/machine/vitals/current`);
    return this.handleResponse(response);
  }

  async getVitalsHistory(limit?: number): Promise<{ success: boolean; data: MachineVitals[]; count: number }> {
    const url = `${this.baseUrl}/machine/vitals/history${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  async startSimulation(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/machine/simulation/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse(response);
  }

  async stopSimulation(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/machine/simulation/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse(response);
  }

  async getSimulationStatus(): Promise<{ success: boolean; data: { running: boolean; log_file: string } }> {
    const response = await fetch(`${this.baseUrl}/machine/simulation/status`);
    return this.handleResponse(response);
  }

  async clearVitalsLogs(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/machine/vitals/clear-logs`, {
      method: 'DELETE',
    });
    return this.handleResponse(response);
  }
}

export const apiClient = new ApiClient();
