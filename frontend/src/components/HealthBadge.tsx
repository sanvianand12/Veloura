import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { HealthCheckResponse } from '../types';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    let interval: number | undefined;
    const fetchHealth = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const data = await apiService.checkHealth();
        if (isMounted) {
          setHealth((current) => current &&
            current.status === data.status &&
            current.service === data.service &&
            current.database === data.database &&
            current.version === data.version ? current : data);
          setLoading((current) => current ? false : current);
        }
      } catch {
        if (isMounted) {
          const data: HealthCheckResponse = {
            status: 'offline',
            service: 'Veloura Backend',
            timestamp: new Date().toISOString(),
            database: 'unreachable',
            version: '0.1.0'
          };
          setHealth((current) => current && current.status === data.status && current.database === data.database ? current : data);
          setLoading((current) => current ? false : current);
        }
      } finally {
        isFetching = false;
      }
    };

    const stopPolling = () => {
      if (interval !== undefined) window.clearInterval(interval);
      interval = undefined;
    };
    const startPolling = () => {
      if (interval === undefined && document.visibilityState !== 'hidden') {
        interval = window.setInterval(fetchHealth, 60_000);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        void fetchHealth();
        startPolling();
      }
    };

    if (document.visibilityState !== 'hidden') {
      fetchHealth();
      startPolling();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      isMounted = false;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const isHealthy = health?.status === 'healthy' && health?.database === 'healthy';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors bg-ivory-100/80 backdrop-blur-sm border-ivory-300">
      <span className="relative flex h-2 w-2">
        {loading ? (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marigold-400 opacity-75"></span>
        ) : isHealthy ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta-500"></span>
        )}
      </span>
      <span className="text-ivory-800 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-terracotta-600" />
        <span className="font-semibold text-ivory-900">API:</span>
        {loading ? (
          <span className="text-ivory-500">Checking...</span>
        ) : isHealthy ? (
          <span className="text-teal-700 font-medium flex items-center gap-1">
            Online <CheckCircle2 className="w-3 h-3 text-teal-600 inline" />
          </span>
        ) : (
          <span className="text-terracotta-700 font-medium flex items-center gap-1">
            Standby / Disconnected <AlertCircle className="w-3 h-3 text-terracotta-600 inline" />
          </span>
        )}
      </span>
    </div>
  );
};

