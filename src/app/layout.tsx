
'use client'

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { PomodoroProvider } from '@/context/pomodoro-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  }

  const isAuthPage = pathname.endsWith('/login') || pathname.endsWith('/signup');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
      <SidebarProvider>
        <Sidebar>
            <div className="flex flex-col h-full p-2">
                <div className="flex-1">
                    <MainNav />
                </div>
                <div>
                    <SidebarMenu>
                        <SidebarMenuItem>
                           <ThemeToggle />
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/settings" className="w-full">
                                <SidebarMenuButton tooltip='Configuración'>
                                    <Settings />
                                    <span>Configuración</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                         {user && (
                          <SidebarMenuItem>
                              <SidebarMenuButton tooltip='Cerrar Sesión' onClick={handleSignOut}>
                                  <LogOut />
                                  <span>Cerrar Sesión</span>
                              </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </div>
            </div>
        </Sidebar>
        <SidebarInset>
            <div className="p-4 md:p-6 lg:p-8 h-screen overflow-y-auto">
              {children}
            </div>
        </SidebarInset>
      </SidebarProvider>
  )
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang='es' suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <PomodoroProvider>
            <ThemeProvider>
              <AppContent>
                {children}
              </AppContent>
              <Toaster />
            </ThemeProvider>
          </PomodoroProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
