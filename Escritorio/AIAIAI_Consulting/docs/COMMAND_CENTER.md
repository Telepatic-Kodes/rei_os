# AMD Command Center - Documentación

## Descripción

Centro de comando brutalist-style para ejecutar y monitorear los 36 agentes de IA del sistema AMD (AI Marketing Department) desde una interfaz web.

## Características Implementadas

### ✅ Backend (JSON-based)
- **5 API Routes** en `/api/command/`:
  - `POST /execute-agent` - Ejecuta agentes individuales
  - `POST /execute-workflow` - Ejecuta workflows multi-agente
  - `GET /executions` - Lista ejecuciones activas/recientes
  - `POST /handoffs/accept` - Acepta handoffs entre agentes
  - `POST /handoffs/reject` - Rechaza handoffs

- **Datos** en archivos JSON:
  - `data/agents.json` - 36 agentes en 7 departamentos
  - `data/workflows.json` - 7 workflows predefinidos
  - `data/executions.json` - Historial de ejecuciones
  - `data/handoffs.json` - Cola de handoffs pendientes

### ✅ Frontend (Brutalist UI)
- **Página Principal**: `/command`
- **4 Componentes Modulares**:
  - `AgentLauncher` - Selecciona y ejecuta agentes
  - `ExecutionMonitor` - Monitor en tiempo real
  - `WorkflowLauncher` - Ejecuta workflows
  - `HandoffQueue` - Gestiona handoffs

### ✅ Diseño Brutalist
- **Fuentes**: JetBrains Mono + Space Grotesk
- **Colores Neon**: Cyan (#00FFFF), Green (#00FF00), Yellow (#FFD700), Red (#FF0044)
- **Animaciones**: Scanlines, pulse, typewriter
- **Estética**: Terminal militar/Aliens (1986)

## Estructura de Archivos

```
AIAIAI_Consulting/
├── app/src/
│   ├── app/
│   │   ├── api/command/          # API Routes
│   │   │   ├── execute-agent/
│   │   │   ├── execute-workflow/
│   │   │   ├── executions/
│   │   │   └── handoffs/
│   │   └── command/              # Página del Command Center
│   │       ├── layout.tsx        # Layout con fuentes brutalist
│   │       └── page.tsx          # Página principal
│   ├── components/command/       # Componentes
│   │   ├── AgentLauncher.tsx
│   │   ├── ExecutionMonitor.tsx
│   │   ├── WorkflowLauncher.tsx
│   │   └── HandoffQueue.tsx
│   └── lib/
│       ├── types/command.ts      # TypeScript types
│       └── data-helpers.ts       # Helpers para JSON
├── data/                         # Datos JSON (backend)
│   ├── agents.json
│   ├── workflows.json
│   ├── executions.json
│   └── handoffs.json
└── app/public/data/              # Datos JSON (frontend)
    ├── agents.json
    └── workflows.json
```

## Cómo Usar

### 1. Iniciar Servidor de Desarrollo

```bash
cd ~/Escritorio/AIAIAI_Consulting/app
npm run dev
```

### 2. Acceder al Command Center

Abrir navegador en: `http://localhost:3000/command`

O hacer clic en "Command Center" en el sidebar.

### 3. Ejecutar un Agente

1. **Seleccionar Agente**: Dropdown con 36 agentes disponibles
2. **Seleccionar Task Type**: Tipos de tarea soportados por el agente
3. **Ingresar Input**: Topic o contenido para la tarea
4. **Click "EXECUTE AGENT"**: Lanza la ejecución

La ejecución aparecerá inmediatamente en el **Execution Monitor** con:
- Progress bar animada (actualización cada 3 segundos)
- Status: queued → running → completed/failed
- Duración, tokens usados, costo ($0.00 en plan MAX)

### 4. Ejecutar un Workflow

1. **Seleccionar Workflow**: 7 workflows disponibles (content, social, SEO, etc.)
2. **Ver Pipeline**: Preview de los pasos del workflow
3. **Ingresar Topic**: Input inicial para el workflow
4. **Click "LAUNCH WORKFLOW"**: Ejecuta todos los pasos

### 5. Gestionar Handoffs

Los handoffs pendientes aparecen en la cola inferior.
- **ACCEPT**: Acepta el handoff y crea tarea para agente receptor
- **REJECT**: Rechaza el handoff con motivo

## Agentes Disponibles (36)

### Content Department (5)
- `content-001` - Blog Writer
- `content-002` - Whitepaper Specialist
- `content-003` - Case Study Writer
- `content-004` - Newsletter Curator
- `content-005` - Video Script Writer

### Social Department (6)
- `social-001` - LinkedIn Strategist
- `social-002` - Twitter Specialist
- `social-003` - Instagram Content Creator
- `social-004` - TikTok Specialist
- `social-005` - Community Manager
- `social-006` - Social Listening Agent

### SEO Department (5)
- `seo-001` - Keyword Researcher
- `seo-002` - Content Optimizer
- `seo-003` - Technical SEO Auditor
- `seo-004` - Link Building Strategist
- `seo-005` - Local SEO Specialist

### Email Department (4)
- `email-001` - Campaign Strategist
- `email-002` - Copywriter
- `email-003` - Automation Builder
- `email-004` - Deliverability Specialist

### Ads Department (5)
- `ads-001` - Google Ads Specialist
- `ads-002` - Facebook Ads Creator
- `ads-003` - Display Ad Designer
- `ads-004` - Video Ad Scripter
- `ads-005` - Landing Page Optimizer

### Analytics Department (5)
- `analytics-001` - Performance Analyst
- `analytics-002` - Attribution Specialist
- `analytics-003` - A/B Test Analyst
- `analytics-004` - Competitive Intelligence
- `analytics-005` - Forecast Modeler

### Brand Department (6)
- `brand-001` - Brand Strategist
- `brand-002` - Tone & Voice Specialist
- `brand-003` - Visual Identity Coordinator
- `brand-004` - Crisis Communication Lead
- `brand-005` - Storytelling Architect
- `brand-006` - Partnership Communications

## Workflows Disponibles (7)

1. **Content Production Flow** (180s)
   - SEO research → Blog → LinkedIn → Twitter

2. **Social Media Blitz** (120s)
   - Posts simultáneos en todas plataformas

3. **SEO Optimization Campaign** (240s)
   - Keywords → Optimization → Audit → Link building

4. **Email Campaign Launch** (150s)
   - Strategy → Copy → Automation → Deliverability

5. **Paid Ads Campaign** (200s)
   - Ad copy → Landing page → Performance tracking

6. **Brand Consistency Check** (180s)
   - Guidelines → Voice audit → Visual review → Crisis prep

7. **Full Marketing Cycle** (420s)
   - End-to-end: Research → Content → Social → Ads → Analytics

## Características Técnicas

### Real-time Simulation
- Las ejecuciones son **simuladas** con:
  - Progress incremental (10% → 25% → 50% → 75% → 90% → 100%)
  - Delays realistas (500ms entre updates)
  - Mock outputs basados en el task type
- Fácil de reemplazar con llamadas reales a Claude API

### Auto-refresh
- Executions y handoffs se actualizan cada 3 segundos automáticamente
- No requiere recargar la página

### Cost Tracking
- Preparado para tracking de costos (actualmente $0.00 en plan MAX)
- Tokens usados registrados en cada ejecución

## Próximos Pasos (Futuro)

### Integración Real con Claude API
Reemplazar `executeAgentAsync()` en `/api/command/execute-agent/route.ts`:

```typescript
// Actual Claude API call
const response = await anthropic.messages.create({
  model: "claude-sonnet-4.5",
  max_tokens: 2048,
  messages: [{
    role: "user",
    content: `Task: ${taskType}. Input: ${JSON.stringify(input)}`
  }]
});
```

### Migración a Convex (Opcional)
Si se necesita escalabilidad real:
1. Instalar Convex: `npm install convex`
2. Migrar schemas de JSON a Convex tables
3. Reemplazar data-helpers con Convex queries/mutations
4. Agregar real-time subscriptions (eliminar polling)

### Features Adicionales
- [ ] History/analytics de ejecuciones
- [ ] Custom workflow builder (drag-drop)
- [ ] Scheduled executions (cron UI)
- [ ] Agent performance metrics
- [ ] Export logs to CSV
- [ ] Abort execution button
- [ ] Multi-agent parallel execution

## Troubleshooting

### Error: Cannot find agents.json
**Solución**: Copiar archivos JSON a public/

```bash
cp ~/Escritorio/AIAIAI_Consulting/data/*.json ~/Escritorio/AIAIAI_Consulting/app/public/data/
```

### Executions no se actualizan
**Solución**: Verificar que el auto-refresh esté activo (cada 3s). Abrir DevTools Console para ver errores.

### API Route 404
**Solución**: Reiniciar servidor de desarrollo:

```bash
cd ~/Escritorio/AIAIAI_Consulting/app
npm run dev
```

## Screenshots

Ver el Command Center en acción:
- Header: Status de agentes online y ejecuciones activas
- Left Panel: Agent Launcher + Workflow Control
- Right Panel: Execution Monitor con progress bars
- Bottom Panel: Handoff Queue

## Notas de Diseño

El diseño brutalist se inspira en:
- **Aliens (1986)** - Sala de comando del Nostromo
- **Terminals militares** de los 80s
- **Matrix (1999)** - Estética hacker green-on-black
- **Cyberpunk aesthetic** - Neon colors y glitch effects
