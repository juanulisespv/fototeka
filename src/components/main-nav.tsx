
'use client'

import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Calendar, ListTodo, Lightbulb, BarChart3, Timer } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePomodoro } from '@/context/pomodoro-context';
import { Badge } from '@/components/ui/badge';

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { timerState } = usePomodoro();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === e.currentTarget.pathname) {
      e.preventDefault();
    }
    setOpenMobile(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimerActive = timerState.status === 'running' || timerState.status === 'paused';

  return (
    <SidebarMenu>
        <SidebarMenuItem>
            <Link href="/" className='w-full' onClick={handleLinkClick}>
                <SidebarMenuButton tooltip='Multimedia' isActive={pathname === '/'}>
                    <Home />
                    <span>Multimedia</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <Link href="/calendar" className='w-full' onClick={handleLinkClick}>
                <SidebarMenuButton tooltip='Calendario' isActive={pathname.includes('/calendar')}>
                    <Calendar />
                    <span>Calendario</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <Link href="/campaigns" className='w-full' onClick={handleLinkClick}>
                <SidebarMenuButton tooltip='Campañas' isActive={pathname.includes('/campaigns')}>
                    <Lightbulb />
                    <span>Campañas</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <Link href="/tasks" className='w-full' onClick={handleLinkClick}>
                <SidebarMenuButton tooltip='Tareas' isActive={pathname.includes('/tasks')}>
                    <ListTodo />
                    <span>Tareas</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <Link href="/pomodoro" className='w-full' onClick={handleLinkClick}>
                <SidebarMenuButton tooltip='Pomodoro' isActive={pathname.includes('/pomodoro')}>
                    <div className="flex items-center gap-2 w-full">
                        <Timer className={isTimerActive ? 'text-green-500' : ''} />
                        <span>Pomodoro</span>
                        {isTimerActive && (
                            <div className="ml-auto flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                    timerState.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                                }`} />
                                <Badge variant="secondary" className="text-xs">
                                    {formatTime(timerState.timeRemaining)}
                                </Badge>
                            </div>
                        )}
                    </div>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <Link href="/analytics" className='w-full' onClick={handleLinkClick}>
                <SidebarMenuButton tooltip='Analytics' isActive={pathname.includes('/analytics')}>
                    <BarChart3 />
                    <span>Analytics</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
    </SidebarMenu>
  )
}
