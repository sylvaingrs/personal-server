import { useCallback, useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';

interface ApiResponseHealth {
  status: string;
  uptime: number;
  timeStamp: string;
}

export default function Status() {
  const [dataHealth, setDataHealth] = useState<ApiResponseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiUrlHealth: string = (import.meta as any).env.DEV
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `${(import.meta as any).env.VITE_API_URL}/health`
    : `${window.location.protocol}//api.${window.location.hostname}/health`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrlHealth);
      if (!res.ok) throw new Error('API error');
      const apiData = await res.json();
      setDataHealth(apiData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [apiUrlHealth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Frontend React</CardTitle>
            {dataHealth && (
              <Badge variant={dataHealth.status === 'online' ? 'default' : 'destructive'}>
                {dataHealth.status}
              </Badge>
            )}
            <CardDescription>Connected to Node.js API on Raspberry Pi 5</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {error && (
            <Alert>
              <AlertDescription>❌ {error}</AlertDescription>
            </Alert>
          )}

          {dataHealth && !loading && (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-600">Uptime</span>
                <span className="text-lg font-bold text-slate-900">
                  {dataHealth.uptime.toFixed(1)}s
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-600">Timestamp</span>
                <span className="text-xs font-bold text-slate-700">
                  {new Date(dataHealth.timeStamp).toLocaleString('fr-FR')}
                </span>
              </div>

              <Button onClick={fetchData} className="w-full" variant="default">
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
