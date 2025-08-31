
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

import { Button } from "@/components/ui/button"
import { useSidebar, SidebarMenuButton } from "./ui/sidebar"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { open } = useSidebar()

  const handleToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <SidebarMenuButton 
        tooltip={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} 
        onClick={handleToggle}
    >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
    </SidebarMenuButton>
  )
}
