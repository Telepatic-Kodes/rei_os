# Brutalist Design System Homologation

**Fecha:** 2026-01-31
**Alcance:** Total - Todas las páginas de AIAIAI Consulting
**Referencia:** AMD Command Center

## 1. Sistema de Diseño Base

### Fundación Visual

#### Tipografía
- **JetBrains Mono** (400, 700) - Contenido general
- **Space Grotesk** (700) - Títulos y headers
- Variables CSS: `--font-jetbrains` y `--font-space`
- Text tracking:
  - `tracking-wide` para labels
  - `tracking-widest` para headers

#### Paleta de Colores (Command Center Standard)
- **Cyan (`#22d3ee`)**: Elementos primarios, borders principales, información neutral
- **Green (`#4ade80`)**: Estados activos, acciones positivas, success
- **Purple (`#c084fc`)**: Features opcionales, metadata secundaria
- **Yellow (`#facc15`)**: Warnings, estados en progreso
- **Red (`#f87171`)**: Errores, alertas críticas
- **Gray**: Texto secundario y disabled states

#### Backgrounds
- Base: `bg-black`
- Paneles: `bg-zinc-950`
- Hover/Active: `bg-zinc-900`

#### Borders
- Principal: `border-2 border-cyan-400`
- Secundario: `border border-cyan-400/30`
- Features opcionales: `border-2 border-purple-400`

#### Layout Global
- App wrapper: `min-h-screen bg-black text-white font-[family-name:var(--font-jetbrains)]`
- Max width contenido: `max-w-[2000px] mx-auto`

---

## 2. Sidebar Brutalista

### Estructura

**Layout:**
- Width: `w-64` (256px) fijo en desktop
- Height: `h-screen` sticky
- Background: `bg-zinc-950`
- Border derecho: `border-r-2 border-cyan-400`

**Header:**
```tsx
<div className="p-6 border-b-2 border-cyan-400">
  <h1 className="text-2xl font-bold text-cyan-400 tracking-widest font-[family-name:var(--font-space)]">
    ▐ AIAIAI ▌
  </h1>
  <div className="text-xs text-gray-500 mt-1 tracking-wide">
    CONSULTING OS
  </div>
</div>
```

**Items de Navegación:**
- Inactivo: `text-gray-400 hover:text-cyan-400 hover:bg-zinc-900 border-l-4 border-transparent`
- Activo: `border-l-4 border-cyan-400 text-cyan-400 bg-zinc-900`
- Iconografía: Símbolos de texto (`▶`, `■`, `◆`) o ASCII (`[>]`, `[#]`, `[*]`)

**Footer:**
```tsx
<div className="border-t-2 border-cyan-400 p-4">
  <div className="flex items-center gap-2 text-xs">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
    <span className="text-green-400">SYNCED</span>
  </div>
</div>
```

---

## 3. Componentes de Datos (Terminal Puro)

### StatCard Brutalista

```tsx
<div className="border-2 border-cyan-400 bg-zinc-950 p-6 relative">
  {/* Label flotante */}
  <div className="absolute -top-3 left-4 bg-black px-2 text-cyan-400 text-xs tracking-widest">
    ▐ METRIC NAME ▌
  </div>

  {/* Valor principal */}
  <div className="text-4xl font-bold text-white font-[family-name:var(--font-space)]">
    42
  </div>

  {/* Metadata */}
  <div className="text-sm text-gray-500 mt-2 tracking-wide">
    SUBTITLE INFO
  </div>

  {/* Tendencia */}
  <div className="text-green-400 text-xs mt-2">
    ▲ +12.5%
  </div>
</div>
```

**Variantes de color:**
- General: `border-cyan-400`
- Activos: `border-green-400`
- Opcionales: `border-purple-400`
- Warnings: `border-yellow-400`

### ProjectCard Brutalista

```tsx
<div className="border-2 border-cyan-400 bg-zinc-950 p-6 hover:border-green-400 transition-colors cursor-pointer">
  {/* Header con status */}
  <div className="flex items-center justify-between mb-4">
    <div className="text-cyan-400 font-bold uppercase tracking-wide">
      PROJECT-NAME
    </div>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-green-400 rounded-full" />
      <span className="text-xs text-green-400">ACTIVE</span>
    </div>
  </div>

  {/* Info tipo clave:valor */}
  <div className="space-y-1 text-sm">
    <div className="text-gray-400">
      COVERAGE: <span className="text-white">87%</span>
    </div>
    <div className="text-gray-400">
      ISSUES: <span className="text-yellow-400">3 OPEN</span>
    </div>
  </div>
</div>
```

---

## 4. Tablas y Visualizaciones

### Tablas Híbridas

```tsx
<div className="border-2 border-cyan-400 bg-zinc-950 relative">
  <div className="absolute -top-3 left-4 bg-black px-2 text-cyan-400 text-xs tracking-widest">
    ▐ DATA TABLE ▌
  </div>

  <table className="w-full">
    <thead className="bg-black border-b-2 border-cyan-400">
      <tr>
        <th className="px-4 py-3 text-left text-cyan-400 text-xs tracking-widest uppercase">
          COLUMN 1
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-cyan-400/30 hover:bg-zinc-900 transition-colors">
        <td className="px-4 py-3 text-white">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Variaciones:**
- Status cells: `<span className="px-2 py-1 bg-green-400/20 border border-green-400 text-green-400 text-xs">ACTIVE</span>`
- Acciones: `<button className="text-cyan-400 hover:text-green-400">▶ VIEW</button>`

### Visualizaciones Numéricas Minimalistas

**Principio:** Reemplazar gráficos por números grandes con tendencias

```tsx
<div className="border-2 border-cyan-400 bg-zinc-950 p-8 relative">
  <div className="absolute -top-3 left-4 bg-black px-2 text-cyan-400 text-xs tracking-widest">
    ▐ TOKEN USAGE ▌
  </div>

  <div className="grid grid-cols-3 gap-8">
    {/* Valor principal */}
    <div>
      <div className="text-xs text-gray-500 mb-2">MONTHLY SPEND</div>
      <div className="text-5xl font-bold text-white font-[family-name:var(--font-space)]">
        $1,247
      </div>
      <div className="text-green-400 text-sm mt-2">
        ▼ -8.3% vs last month
      </div>
    </div>

    {/* Más métricas... */}
  </div>
</div>
```

**Símbolos de tendencia:**
- `▲` - Incremento
- `▼` - Decremento
- `─` - Estable

---

## 5. Formularios e Inputs

### Text Input

```tsx
<div>
  <label className="block text-cyan-400 text-sm mb-2 tracking-wide uppercase">
    Field Label
  </label>
  <input
    type="text"
    className="w-full bg-black border-2 border-cyan-400 text-white p-3 placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
    placeholder="Enter value..."
  />
</div>
```

### Select/Dropdown

```tsx
<select className="w-full bg-black border-2 border-cyan-400 text-cyan-400 p-3 uppercase tracking-wide focus:outline-none focus:border-green-400 transition-colors">
  <option value="">-- SELECT OPTION --</option>
  <option value="1">OPTION 1</option>
</select>
```

### Botones

**Primario:**
```tsx
<button className="w-full bg-gradient-to-r from-cyan-400 to-green-400 text-black font-bold py-4 px-6 uppercase tracking-widest hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all">
  ▶ ACTION TEXT
</button>
```

**Secundario:**
```tsx
<button className="border-2 border-cyan-400 text-cyan-400 py-3 px-6 uppercase tracking-wide hover:bg-cyan-400 hover:text-black transition-all">
  SECONDARY ACTION
</button>
```

**Destructivo:**
```tsx
<button className="border-2 border-red-400 text-red-400 py-3 px-6 uppercase tracking-wide hover:bg-red-400 hover:text-black transition-all">
  ✕ DELETE
</button>
```

---

## 6. Estados de Loading (Híbrido)

### A) Loading de Página Completa

```tsx
<div className="flex items-center justify-center h-screen bg-black text-cyan-400">
  <div className="text-center">
    <div className="text-4xl mb-4 font-[family-name:var(--font-space)] tracking-widest">
      ▐ LOADING DASHBOARD ▌
    </div>
    <div className="text-xl animate-pulse">INITIALIZING...</div>
  </div>
</div>
```

### B) Loading Inline (Spinners Neón)

```tsx
<div className="flex items-center gap-3 text-cyan-400">
  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
  <span className="text-sm">LOADING DATA...</span>
</div>
```

### C) Progress Bars

```tsx
<div className="border-2 border-cyan-400 p-4">
  <div className="flex justify-between text-xs text-gray-400 mb-2">
    <span>PROCESSING...</span>
    <span>67%</span>
  </div>
  <div className="h-2 bg-zinc-900 border border-cyan-400">
    <div className="h-full bg-gradient-to-r from-cyan-400 to-green-400 transition-all" style={{width: '67%'}} />
  </div>
</div>
```

### D) Toast Notifications

```tsx
<Toaster
  theme="dark"
  toastOptions={{
    style: {
      background: '#18181b',
      border: '2px solid #22d3ee',
      color: '#22d3ee',
      fontFamily: 'var(--font-jetbrains)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }
  }}
/>
```

---

## 7. Modales y Responsive

### Modales Brutalistas

```tsx
{/* Backdrop */}
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
  {/* Modal */}
  <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
    <div className="border-2 border-cyan-400 bg-zinc-950 p-8 relative">
      {/* Header */}
      <div className="absolute -top-3 left-4 bg-black px-2 text-cyan-400 text-xs tracking-widest">
        ▐ MODAL TITLE ▌
      </div>

      {/* Close */}
      <button className="absolute -top-3 right-4 bg-black px-2 text-red-400 hover:text-red-300">
        ✕
      </button>

      {/* Content & Actions */}
    </div>
  </div>
</div>
```

### Comportamiento Responsive

**Breakpoints:**
- **Desktop (lg+):** Sidebar visible fijo, grid-cols-4
- **Tablet (md):** Sidebar colapsable, grid-cols-2
- **Mobile (sm):** Sidebar como drawer, grid-cols-1

**Sidebar Responsive:**
```tsx
<button className="lg:hidden fixed top-4 left-4 z-50 bg-cyan-400 text-black p-3">☰</button>

<aside className="fixed lg:static w-64 transform -translate-x-full lg:translate-x-0 transition-transform z-40">
  {/* Sidebar content */}
</aside>
```

---

## 8. Páginas Específicas

### Dashboard Principal (`/`)

- Stats Grid (4 cols desktop, 2 tablet, 1 mobile)
- Token Summary (números, sin gráficos)
- Projects Table

### Projects (`/projects`)

- Filtros en panel superior
- Projects Grid (2 cols desktop, 1 mobile)
- ProjectCard con hover effects

### Quality (`/quality`)

- Quality Overview (3 métricas grandes)
- Coverage: `border-green-400`
- Issues: `border-yellow-400`
- Code Quality: `border-cyan-400`
- Issues Table

### Tokens (`/tokens`)

- Token Summary Large (3 métricas)
- Usage History Table (fecha, proyecto, tokens, cost)

### Kanban (`/kanban`)

- Board con 4 columnas: TODO, IN PROGRESS, REVIEW, DONE
- Cards con `border border-cyan-400`
- Column headers con `border-2 border-purple-400`

---

## 9. Error States y Empty States

### Error de Página

```tsx
<div className="flex items-center justify-center min-h-screen bg-black">
  <div className="text-center">
    <div className="text-8xl font-bold text-red-400 font-[family-name:var(--font-space)]">404</div>
    <div className="text-2xl text-cyan-400 mt-4 tracking-widest">▐ PAGE NOT FOUND ▌</div>
    <div className="text-gray-500 mt-2">The requested resource does not exist</div>
    <button className="mt-6 border-2 border-cyan-400 text-cyan-400 px-6 py-3 uppercase">
      ← RETURN TO DASHBOARD
    </button>
  </div>
</div>
```

### Error Inline

```tsx
<div className="border-2 border-red-400 bg-red-400/10 p-4">
  <div className="flex items-center gap-3">
    <span className="text-red-400 text-xl">✕</span>
    <div>
      <div className="text-red-400 font-bold uppercase text-sm">ERROR</div>
      <div className="text-gray-400 text-sm">Failed to load data. Please try again.</div>
    </div>
  </div>
</div>
```

### Empty State

```tsx
<div className="border-2 border-cyan-400 bg-zinc-950 p-12 text-center">
  <div className="text-6xl text-gray-700 mb-4">[ ]</div>
  <div className="text-cyan-400 text-xl uppercase tracking-wide mb-2">NO DATA FOUND</div>
  <div className="text-gray-500 text-sm mb-6">There are no items to display</div>
  <button className="bg-gradient-to-r from-cyan-400 to-green-400 text-black font-bold py-3 px-6 uppercase">
    + CREATE NEW
  </button>
</div>
```

---

## 10. Arquitectura de Implementación

### Estructura de Archivos

```
app/
├── layout.tsx                 # Root layout con fonts globales
├── globals.css               # Estilos base + variables CSS
├── page.tsx                  # Dashboard (actualizado)
├── projects/page.tsx         # Projects (actualizado)
├── quality/page.tsx          # Quality (actualizado)
├── tokens/page.tsx           # Tokens (actualizado)
├── kanban/page.tsx          # Kanban (actualizado)
└── command/                  # Ya existe, mantener

components/
├── ui/                       # shadcn components (actualizar estilos)
│   ├── button.tsx           # Versión brutalista
│   ├── input.tsx            # Versión brutalista
│   └── ...
├── brutalist/               # Nuevos componentes brutalistas
│   ├── stat-card.tsx
│   ├── project-card.tsx
│   ├── data-table.tsx
│   ├── panel.tsx            # Componente genérico de panel
│   ├── section-header.tsx
│   └── sidebar.tsx
├── layouts/
│   └── brutalist-layout.tsx # Layout wrapper con sidebar
└── [componentes existentes actualizados]

lib/
├── styles/
│   ├── brutalist-theme.ts   # Constantes de colores, borders, etc.
│   └── animations.ts        # Animaciones (pulse, glow, etc.)
└── [resto sin cambios]
```

### Configuración Global

**globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-jetbrains: 'JetBrains Mono', monospace;
    --font-space: 'Space Grotesk', sans-serif;

    /* Brutalist colors */
    --brutalist-cyan: #22d3ee;
    --brutalist-green: #4ade80;
    --brutalist-purple: #c084fc;
    --brutalist-yellow: #facc15;
    --brutalist-red: #f87171;
  }

  body {
    @apply bg-black text-white;
  }
}

@layer utilities {
  .text-glow-cyan {
    text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
  }

  .border-glow-green {
    box-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
  }
}
```

**Root Layout:**
```tsx
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["700"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <body className="font-[family-name:var(--font-jetbrains)]">
        <BrutalistLayout>
          {children}
        </BrutalistLayout>
        <Toaster theme="dark" /* config brutalista */ />
      </body>
    </html>
  );
}
```

---

## 11. Plan de Migración por Fases

### Fase 1: Fundación (1-2 días)
- Actualizar layout root con fonts
- Crear componentes base en `/components/brutalist/`
- Actualizar globals.css con variables y utilities

### Fase 2: Layout Global (1 día)
- Implementar sidebar brutalista
- Crear BrutalistLayout wrapper
- Responsive behavior del sidebar

### Fase 3: Componentes Core (2 días)
- StatCard, ProjectCard, DataTable
- Panel genérico, SectionHeader
- Botones, inputs, selects actualizados

### Fase 4: Páginas (2-3 días)
- Dashboard principal
- Projects
- Quality
- Tokens
- Kanban

### Fase 5: Refinamiento (1 día)
- Loading states
- Error/empty states
- Animaciones y transiciones
- Testing responsive

---

## Principios de Diseño

1. **Terminal Puro**: Sin gradientes suaves, bordes gruesos, contraste máximo
2. **Colores Semánticos**: Cyan=primario, Green=éxito, Purple=opcional, Yellow=warning, Red=error
3. **Tipografía Técnica**: JetBrains Mono + Space Grotesk, siempre uppercase en labels
4. **Números sobre Gráficos**: Métricas grandes con símbolos de tendencia (▲▼─)
5. **Consistencia con Command Center**: Mantener la misma estética y patrones
6. **Responsive First**: Diseño que funciona en mobile, tablet y desktop
7. **Accesibilidad**: Alto contraste, focus states claros, navegación por teclado

---

## Referencias

- AMD Command Center: `/app/src/app/command/`
- Componentes existentes: `/app/src/components/command/`
- Estilos actuales: `/app/src/app/command/layout.tsx`
