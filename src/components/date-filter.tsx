'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateFilter } from '@/lib/types';
import { CalendarIcon, FilterIcon } from 'lucide-react';

interface DateFilterProps {
  filter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
}

export function DateFilterComponent({ filter, onFilterChange }: DateFilterProps) {
  const [customStartDate, setCustomStartDate] = useState(filter.startDate || '');
  const [customEndDate, setCustomEndDate] = useState(filter.endDate || '');

  const handleFilterTypeChange = (type: DateFilter['type']) => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (type) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart.toISOString();
        endDate = now.toISOString();
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = now.toISOString();
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        break;
    }

    onFilterChange({ type, startDate, endDate });
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onFilterChange({
        type: 'custom',
        startDate: new Date(customStartDate).toISOString(),
        endDate: new Date(customEndDate + 'T23:59:59').toISOString(),
      });
    }
  };

  const getFilterDescription = () => {
    switch (filter.type) {
      case 'daily':
        return 'Registros de hoy';
      case 'weekly':
        return 'Registros de esta semana';
      case 'monthly':
        return 'Registros de este mes';
      case 'custom':
        if (filter.startDate && filter.endDate) {
          const start = new Date(filter.startDate).toLocaleDateString();
          const end = new Date(filter.endDate).toLocaleDateString();
          return `Del ${start} al ${end}`;
        }
        return 'Rango personalizado';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FilterIcon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Filtros por Fecha</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selector de tipo de filtro */}
        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={filter.type} onValueChange={handleFilterTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Hoy</SelectItem>
              <SelectItem value="weekly">Esta semana</SelectItem>
              <SelectItem value="monthly">Este mes</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros personalizados */}
        {filter.type === 'custom' && (
          <>
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de fin</Label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleCustomDateChange}
                disabled={!customStartDate || !customEndDate}
                className="w-full"
              >
                Aplicar
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Descripción del filtro actual */}
      <Card className="bg-muted/50">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{getFilterDescription()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter.type === 'daily' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterTypeChange('daily')}
        >
          Hoy
        </Button>
        <Button
          variant={filter.type === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterTypeChange('weekly')}
        >
          Esta semana
        </Button>
        <Button
          variant={filter.type === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterTypeChange('monthly')}
        >
          Este mes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            onFilterChange({
              type: 'custom',
              startDate: threeMonthsAgo.toISOString(),
              endDate: new Date().toISOString(),
            });
          }}
        >
          Últimos 3 meses
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            onFilterChange({
              type: 'custom',
              startDate: oneYearAgo.toISOString(),
              endDate: new Date().toISOString(),
            });
          }}
        >
          Último año
        </Button>
      </div>
    </div>
  );
}
