
# Fototeca

Una aplicación web moderna para gestión de contenido visual y campañas de marketing, construida con Next.js 15, TypeScript, y Firebase.

## 🚀 Características

- **Gestión de Campañas**: Crear, editar y organizar campañas de marketing
- **Calendario Interactivo**: Planificación visual de contenido
- **Galería de Medios**: Subir y gestionar imágenes y videos
- **Gestión de Tareas**: Sistema de tareas con tablero Kanban
- **Autenticación**: Sistema completo de login/signup
- **Interfaz Moderna**: UI construida con shadcn/ui y Tailwind CSS

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Estado**: React Context API
- **Validación**: Zod + React Hook Form
- **Iconos**: Lucide React

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone [URL-DEL-REPO]
cd fototeka
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.local
```
Edita `.env.local` con tu configuración de Firebase.

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

Abre [http://localhost:9002](http://localhost:9002) en tu navegador.

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo con Turbopack
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Ejecuta la aplicación en modo producción
- `npm run lint` - Ejecuta el linter
- `npm run typecheck` - Verifica los tipos de TypeScript

## 🚀 Despliegue en Vercel

Este proyecto está optimizado para desplegarse en Vercel:

1. Haz push de tu código a GitHub
2. Importa tu repositorio en [Vercel](https://vercel.com)
3. Configura las variables de entorno de Firebase en Vercel
4. ¡Despliega!

## 📁 Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
├── components/          # Componentes reutilizables
├── context/             # Context providers
├── hooks/               # Custom hooks
└── lib/                 # Utilidades y configuración
```

## 🔑 Variables de Entorno

Necesitarás configurar las siguientes variables de entorno para Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 📄 Licencia

[Especifica tu licencia aquí]
