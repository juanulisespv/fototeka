'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import withAuth from '@/hoc/withAuth';
import PageHeader from '@/components/page-header';
import { FollowerInput } from '@/components/follower-input';
import { FollowerCharts } from '@/components/follower-charts';
import { FollowerStats } from '@/components/follower-stats';
import { DateFilterComponent } from '@/components/date-filter';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowerRecord, DateFilter, SocialNetwork } from '@/lib/types';
import { getFollowerRecords } from '@/lib/follower-service';

function AnalyticsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<FollowerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'monthly' });
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork>('Instagram');

  const socialNetworks: SocialNetwork[] = ['LinkedIn', 'Instagram', 'YouTube', 'Facebook', 'Pinterest', 'TikTok'];

  useEffect(() => {
    if (user) {
      loadFollowerRecords();
    }
  }, [user, dateFilter]);

  const loadFollowerRecords = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getFollowerRecords(user.uid, dateFilter);
      setRecords(data);
    } catch (error) {
      console.error('Error loading follower records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAdded = () => {
    loadFollowerRecords();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Analytics de Seguidores"
        description="Registra y analiza el crecimiento de tus seguidores en redes sociales"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input para nuevos registros */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <FollowerInput 
                onRecordAdded={handleRecordAdded}
                userId={user.uid}
              />
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas generales */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <FollowerStats 
                records={records}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros por fecha */}
      <Card>
        <CardContent className="p-6">
          <DateFilterComponent
            filter={dateFilter}
            onFilterChange={setDateFilter}
          />
        </CardContent>
      </Card>

      {/* Gráficos por red social */}
      <Tabs value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as SocialNetwork)}>
        <TabsList className="grid w-full grid-cols-6">
          {socialNetworks.map((network) => (
            <TabsTrigger key={network} value={network}>
              {network}
            </TabsTrigger>
          ))}
        </TabsList>

        {socialNetworks.map((network) => (
          <TabsContent key={network} value={network}>
            <Card>
              <CardContent className="p-6">
                <FollowerCharts
                  records={records.filter(r => r.socialNetwork === network)}
                  socialNetwork={network}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default withAuth(AnalyticsPage);
