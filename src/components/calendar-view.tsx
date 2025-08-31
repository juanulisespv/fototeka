
"use client"

import { useState, useEffect } from 'react';
import { add, sub, format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday, isSameMonth, isSameDay, getHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CalendarHeader from './calendar-header';
import type { EditorialPost } from '@/lib/types';
import { Instagram, Facebook, Linkedin, Twitter, MessageCircle, Link2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

type View = 'month' | 'week';

type CalendarViewProps = {
    onNewPost: () => void;
    posts: EditorialPost[];
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
}

const socialNetworkIcons: Record<string, React.ElementType> = {
    Instagram: Instagram,
    Facebook: Facebook,
    LinkedIn: Linkedin,
    X: Twitter,
    TikTok: MessageCircle,
};

const socialNetworkColors: Record<string, string> = {
    Instagram: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/60',
    Facebook: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    LinkedIn: 'bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/60',
    X: 'bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/60',
    TikTok: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
};


const SocialIcon = ({ network }: { network: string }) => {
    const Icon = socialNetworkIcons[network] || Link2;
    return <Icon className="h-4 w-4" />;
};


export default function CalendarView({ onNewPost, posts, currentDate, setCurrentDate, selectedDate, onDateSelect }: CalendarViewProps) {
  const [view, setView] = useState<View>('month');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(sub(currentDate, { months: 1 }));
    } else {
      setCurrentDate(sub(currentDate, { weeks: 1 }));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(add(currentDate, { months: 1 }));
    } else {
      setCurrentDate(add(currentDate, { weeks: 1 }));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect(today);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="grid grid-cols-7 border-t border-l">
        {weekDays.map(day => (
          <div key={day} className="p-2 border-r border-b bg-gray-50 dark:bg-gray-800 text-center font-semibold text-xs md:text-sm">{day}</div>
        ))}
        {days.map((day) => {
            const postsForDay = posts.filter(p => isSameDay(new Date(p.publicationDate), day));
            const isCurrentDay = hydrated && isToday(day);
            const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <div
                key={day.toString()}
                className={cn(
                    "h-32 p-2 border-r relative overflow-hidden cursor-pointer transition-colors border-b", 
                    !isSameMonth(day, currentDate) && "bg-gray-50 dark:bg-gray-800/50 text-muted-foreground",
                    isSelectedDay ? "bg-primary/10 ring-2 ring-inset ring-primary z-10" : "hover:bg-accent/50",
                )}
                onClick={() => onDateSelect(day)}
              >
                  <span className={cn("absolute top-2 right-2 text-sm", isCurrentDay && !isSelectedDay && "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center")}>
                      {format(day, 'd')}
                  </span>
                  <ScrollArea className="h-full">
                      <div className="space-y-1 pr-2 pt-8">
                          {postsForDay.map((post) => (
                            <div
                              key={post.id}
                              className="mb-1"
                            >
                              <Badge variant="outline" className={cn("w-full flex items-center gap-2 p-1 truncate text-xs font-normal border rounded-md", socialNetworkColors[post.socialNetwork] || 'border-gray-200')}>
                                  <SocialIcon network={post.socialNetwork} />
                                  <span className="truncate hidden md:inline">{post.title}</span>
                              </Badge>
                            </div>
                          ))}
                      </div>
                  </ScrollArea>
              </div>
            )
        })}
      </div>
    );
  };
  
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex border-t border-l">
        <div className="w-16 shrink-0">
           {hours.map(hour => <div key={hour} className="h-16 border-b border-r text-center text-xs p-1 pt-2 bg-gray-50 dark:bg-gray-800">{`${hour.toString().padStart(2, '0')}:00`}</div>)}
        </div>
        <div className="grid grid-cols-7 flex-1 min-w-[700px]">
          {days.map(day => {
            const isCurrentDay = hydrated && isToday(day);
            const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
            return (
              <div
                  key={day.toString()}
                  className={cn("relative cursor-pointer border-r", isSelectedDay ? "bg-primary/10" : "hover:bg-accent/50")}
                  onClick={() => onDateSelect(day)}
              >
                <div className={cn("text-center p-2 border-b sticky top-0 z-10", isCurrentDay && !isSelectedDay ? "bg-secondary" : "bg-background")}>
                  <p className="font-semibold text-xs md:text-sm">{format(day, 'EEE', { locale: es }).toLowerCase()}</p>
                  <p className={cn("text-lg md:text-2xl", isCurrentDay && "text-primary")}>{format(day, 'd')}</p>
                </div>
                <div className="relative">
                  {hours.map(hour => <div key={hour} className="h-16 border-b"></div>)}
                  {posts.filter(p => isSameDay(new Date(p.publicationDate), day)).map((post) => {
                      const postHour = getHours(new Date(post.publicationDate));
                      return (
                        <div
                          key={post.id}
                          style={{ top: `${postHour * 4}rem`}}
                          className="absolute w-full p-1 z-20"
                        >
                          <Badge variant="outline" className={cn("w-full flex items-center gap-2 p-1 truncate text-xs font-normal border rounded-md", socialNetworkColors[post.socialNetwork] || 'border-gray-200')}>
                              <SocialIcon network={post.socialNetwork} />
                              <span className="truncate">{post.title}</span>
                          </Badge>
                        </div>
                      )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  if (!hydrated) {
    // Render a skeleton or null during SSR to avoid hydration mismatch
    return null;
  }

  return (
    <div className="bg-card rounded-lg border">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        setView={setView}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onNewPost={onNewPost}
      />
      <div className="overflow-x-auto">
        {view === 'month' && renderMonthView()}
        {view === 'week' && <ScrollArea className="w-full whitespace-nowrap">{renderWeekView()}</ScrollArea>}
      </div>
    </div>
  );
}
