
'use client';

import withAuth from "@/hoc/withAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SettingsPage() {
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administra la configuración de tu aplicación.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Idioma</CardTitle>
          <CardDescription>Elige el idioma de visualización de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>La configuración de idioma estará disponible en una futura actualización.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default withAuth(SettingsPage);
