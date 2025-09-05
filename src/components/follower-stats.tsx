'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FollowerRecord, SocialNetworkStats } from '@/lib/types';
import { SocialNetworkIcon } from '@/components/social-network-icon';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from 'lucide-react';

interface FollowerStatsProps {
  records: FollowerRecord[];
  loading: boolean;
}

export function FollowerStats({ records, loading }: FollowerStatsProps) {
  const stats = useMemo(() => {
    if (!records.length) return [];

    const networkStats: SocialNetworkStats[] = [];
    const networks = ['LinkedIn', 'Instagram', 'YouTube', 'Facebook', 'Pinterest', 'TikTok'] as const;

    networks.forEach(network => {
      const networkRecords = records
        .filter(r => r.socialNetwork === network)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

      if (networkRecords.length === 0) return;

      const latest = networkRecords[0];
      const previous = networkRecords[1];

      const currentFollowers = latest.followerCount;
      const previousFollowers = previous?.followerCount || 0;
      const growth = currentFollowers - previousFollowers;
      const growthPercentage = previousFollowers > 0 ? (growth / previousFollowers) * 100 : 0;

      networkStats.push({
        network,
        currentFollowers,
        previousFollowers,
        growth,
        growthPercentage,
        lastUpdated: latest.recordedAt,
      });
    });

    return networkStats.sort((a, b) => b.currentFollowers - a.currentFollowers);
  }, [records]);

  const totalFollowers = stats.reduce((sum, stat) => sum + stat.currentFollowers, 0);
  const totalGrowth = stats.reduce((sum, stat) => sum + stat.growth, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
          📊
        </div>
        <h3 className="text-lg font-medium mb-2">No hay datos aún</h3>
        <p className="text-muted-foreground">
          Comienza registrando el número de seguidores de tus redes sociales
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            📈
          </div>
          <h3 className="text-lg font-semibold">Resumen de Seguidores</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total de seguidores</div>
        </div>
      </div>

      {/* Estadísticas por red social */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.network} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <SocialNetworkIcon network={stat.network} size="sm" />
                  <span>{stat.network}</span>
                </div>
                <Badge variant={stat.growth >= 0 ? "default" : "destructive"} className="text-xs">
                  {stat.growth >= 0 ? '+' : ''}{stat.growth.toLocaleString()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {stat.currentFollowers.toLocaleString()}
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  {stat.growth !== 0 && (
                    <>
                      {stat.growth > 0 ? (
                        <ArrowUpIcon className="w-3 h-3 text-green-600" />
                      ) : (
                        <ArrowDownIcon className="w-3 h-3 text-red-600" />
                      )}
                      <span className={stat.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(stat.growthPercentage).toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">
                    vs anterior
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Actualizado: {new Date(stat.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen total */}
      {totalGrowth !== 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUpIcon className="w-5 h-5 text-primary" />
                <span className="font-medium">Crecimiento total</span>
              </div>
              <div className="flex items-center space-x-2">
                {totalGrowth > 0 ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-bold ${totalGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalGrowth > 0 ? '+' : ''}{totalGrowth.toLocaleString()} seguidores
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
