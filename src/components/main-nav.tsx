
'use client'

import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Calendar, ListTodo, Lightbulb, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === e.currentTarget.pathname) {
      e.preventDefault();
    }
    setOpenMobile(false);
  };

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
