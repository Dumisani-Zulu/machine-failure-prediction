'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PredictionRequest, PredictionResponse } from '@/types';

const predictionSchema = z.object({
  temperature: z.number().min(-50).max(200),
  pressure: z.number().min(0).max(1000),
  vibration: z.number().min(0).max(100),
});

type PredictionFormData = z.infer<typeof predictionSchema>;

export function PredictionForm() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
  defaultValues: {
    temperature: 25,
    pressure: 50,
    vibration: 5,
  },
  });

  const onSubmit = async (data: PredictionFormData) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const result = await apiClient.predict(data);
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleData = () => {
    setValue('temperature', 75.5);
    setValue('pressure', 150.2);
    setValue('vibration', 8.7);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Machine Learning Prediction
          </CardTitle>
          <CardDescription>
            Enter sensor data to predict machine failure probability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  {...register('temperature', { valueAsNumber: true })}
                />
                {errors.temperature && (
                  <p className="text-sm text-red-500">{errors.temperature.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pressure">Pressure (Pa)</Label>
                <Input
                  id="pressure"
                  type="number"
                  step="0.1"
                  {...register('pressure', { valueAsNumber: true })}
                />
                {errors.pressure && (
                  <p className="text-sm text-red-500">{errors.pressure.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vibration">Vibration (mm/s)</Label>
                <Input
                  id="vibration"
                  type="number"
                  step="0.1"
                  {...register('vibration', { valueAsNumber: true })}
                />
                {errors.vibration && (
                  <p className="text-sm text-red-500">{errors.vibration.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Predict Failure
              </Button>
              <Button type="button" variant="outline" onClick={fillSampleData}>
                Sample Data
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Results</CardTitle>
          <CardDescription>
            Machine failure analysis based on sensor data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {prediction && (
            <div className="space-y-4">
              <Alert variant={prediction.prediction === 1 ? "destructive" : "default"}>
                {prediction.prediction === 1 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>
                    {prediction.prediction === 1 ? 'Failure Predicted' : 'No Failure Detected'}
                  </strong>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Failure Probability</Label>
                  <div className="text-2xl font-bold text-red-500">
                    {(prediction.probability_failure * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Normal Operation Probability</Label>
                  <div className="text-2xl font-bold text-green-500">
                    {(prediction.probability_no_failure * 100).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.probability_failure * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {!prediction && !error && !isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Enter sensor data and click "Predict Failure" to see results
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Analyzing sensor data...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
