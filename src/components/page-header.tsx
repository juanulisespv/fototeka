
"use client"

import React from "react";
import { SidebarTrigger } from "./ui/sidebar";

type PageHeaderProps = {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
                    {description && <p className="text-muted-foreground mt-1">{description}</p>}
                </div>
            </div>
            {children && <div className="w-full sm:w-auto">{children}</div>}
        </header>
    )
}
