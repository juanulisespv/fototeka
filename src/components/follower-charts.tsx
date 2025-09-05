'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowerRecord, SocialNetwork } from '@/lib/types';
import { SocialNetworkIcon } from '@/components/social-network-icon';

interface FollowerChartsProps {
  records: FollowerRecord[];
  socialNetwork: SocialNetwork;
  loading: boolean;
}

export function FollowerCharts({ records, socialNetwork, loading }: FollowerChartsProps) {
  const chartData = useMemo(() => {
    if (!records.length) return [];

    return records
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((record, index, array) => {
        const previousRecord = array[index - 1];
        const growth = previousRecord ? record.followerCount - previousRecord.followerCount : 0;
        
        return {
          date: new Date(record.recordedAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }),
          followers: record.followerCount,
          growth: growth,
          fullDate: record.recordedAt,
        };
      });
  }, [records]);

  const getNetworkColor = (network: SocialNetwork) => {
    switch (network) {
      case 'LinkedIn': return '#0077B5';
      case 'Instagram': return '#E4405F';
      case 'YouTube': return '#FF0000';
      case 'Facebook': return '#1877F2';
      case 'Pinterest': return '#BD081C';
      case 'TikTok': return '#000000';
      default: return '#8884d8';
    }
  };

  const networkColor = getNetworkColor(socialNetwork);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <SocialNetworkIcon network={socialNetwork} size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay datos para {socialNetwork}</h3>
        <p className="text-muted-foreground">
          Registra el número de seguidores para comenzar a ver los gráficos
        </p>
      </div>
    );
  }

  const totalGrowth = chartData.length > 1 
    ? chartData[chartData.length - 1].followers - chartData[0].followers 
    : 0;
  
  const averageGrowth = chartData.length > 1 
    ? totalGrowth / (chartData.length - 1) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SocialNetworkIcon network={socialNetwork} size="md" />
          <h3 className="text-lg font-semibold">{socialNetwork}</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            {chartData.length} registro{chartData.length !== 1 ? 's' : ''}
          </div>
          {totalGrowth !== 0 && (
            <div className={`text-sm font-medium ${totalGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGrowth > 0 ? '+' : ''}{totalGrowth.toLocaleString()} total
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de evolución de seguidores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución de Seguidores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Seguidores']}
                  labelFormatter={(label) => `Fecha: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke={networkColor}
                  fill={networkColor}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de crecimiento */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crecimiento por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(1)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value > 0 ? `+${value}` : value.toString()}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString(), 
                      'Crecimiento'
                    ]}
                    labelFormatter={(label) => `Período: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="growth"
                    stroke={networkColor}
                    strokeWidth={2}
                    dot={{ fill: networkColor, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas resumidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {chartData[chartData.length - 1]?.followers.toLocaleString() || 0}
            </div>
            <div className="text-sm text-muted-foreground">Seguidores actuales</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGrowth > 0 ? '+' : ''}{totalGrowth.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Crecimiento total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${averageGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {averageGrowth > 0 ? '+' : ''}{Math.round(averageGrowth).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Promedio por registro</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
