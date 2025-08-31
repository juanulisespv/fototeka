
"use client"

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from './ui/button';

type View = 'month' | 'week';

type CalendarHeaderProps = {
  currentDate: Date;
  view: View;
  setView: (view: View) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewPost: () => void;
};

export default function CalendarHeader({ currentDate, view, setView, onPrev, onNext, onToday, onNewPost }: CalendarHeaderProps) {
  const getHeaderText = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: es }).toLowerCase();
    if (view === 'week') {
      const start = format(currentDate, 'd MMM', { locale: es });
      const end = format(new Date(currentDate).setDate(currentDate.getDate() + 6), 'd MMM, yyyy', { locale: es });
      return `${start} - ${end}`.toLowerCase();
    }
    return format(currentDate, 'd MMMM, yyyy', { locale: es }).toLowerCase();
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Button variant="outline" onClick={onToday}>Hoy</Button>
        <div className="flex items-center gap-2 md:hidden ml-auto">
            <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>Mes</Button>
            <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>Semana</Button>
        </div>
      </div>

      <h2 className="text-xl font-semibold order-first md:order-none">{getHeaderText()}</h2>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button variant="outline" onClick={onNewPost} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Publicación
        </Button>
        <div className="hidden md:flex items-center gap-2">
            <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>Mes</Button>
            <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>Semana</Button>
        </div>
      </div>
    </div>
  );
}
