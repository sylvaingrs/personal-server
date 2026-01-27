import { useCallback, useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { mainUrl } from '@/lib/utils';

interface ApiResponseHealth {
  status: string;
  uptime: number;
  timeStamp: string;
}

export default function Status() {
  const [dataHealth, setDataHealth] = useState<ApiResponseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDataFront = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${mainUrl}/health`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('API error');
      const apiData = await res.json();
      setDataHealth(apiData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataFront();
  }, [fetchDataFront]);

  return (
    <div className="s-container s-flex justify-center">
      <Card className="">
        <CardHeader className="flex flex-row">
          <CardTitle className="text-2xl mr-2">Frontend React</CardTitle>
          {dataHealth && (
            <Badge
              className="mr-2"
              variant={dataHealth.status === 'online' ? 'default' : 'destructive'}
            >
              {dataHealth.status}
            </Badge>
          )}
          <CardDescription>Connected to Node.js API on Raspberry Pi 5</CardDescription>
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

              <Button onClick={fetchDataFront} className="w-full" variant="default">
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
