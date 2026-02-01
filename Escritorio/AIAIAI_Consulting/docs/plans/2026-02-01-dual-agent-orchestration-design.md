# Diseño: Sistema de Orquestación Dual-Agent Claude + Codex

**Fecha**: 2026-02-01
**Proyecto**: AIAIAI Consulting - Orquestación Inteligente
**Objetivo**: Sistema híbrido Claude (arquitecto) + ChatGPT Pro/Codex (constructor) con routing inteligente y optimización de costos del 46%

## Resumen Ejecutivo

Sistema de orquestación dual-agent que maximiza ROI mediante routing inteligente basado en tipo de tarea. Claude maneja planning/review (alto input context), ChatGPT Pro maneja implementación (alto output, $0 costo adicional). MCP Server con Convex provee sincronización en tiempo real. Dashboard Next.js integrado muestra métricas, costos y learning progress.

**ROI esperado**: Ahorro del 46% ($130/mes en 100 features) vs. usar solo Claude.

---

## 1. Arquitectura General

### 1.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (CLI/Web)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                 Orchestrator (Routing Engine)                │
│  - Analiza prompt/tarea                                      │
│  - Clasifica tipo (planning/generation/review)               │
│  - Sugiere agente (Claude/ChatGPT Pro) + confianza %        │
│  - Espera confirmación/override del usuario                  │
└────────┬───────────────────────────────┬────────────────────┘
         │                               │
         v                               v
┌──────────────────┐            ┌──────────────────┐
│  Claude Agent    │            │  ChatGPT Pro     │
│  (Arquitecto)    │            │  (Constructor)   │
│                  │            │                  │
│ - Planning       │            │ - Code gen       │
│ - Analysis       │            │ - Boilerplate    │
│ - Review         │            │ - Refactoring    │
│ - Architecture   │            │ - Implementation │
│ API: Anthropic   │            │ Web: Playwright  │
└────────┬─────────┘            └─────────┬────────┘
         │                                │
         └────────────┬───────────────────┘
                      │
                      v
         ┌────────────────────────────┐
         │   MCP Server (Convex)      │
         │                            │
         │ - Shared context           │
         │ - Plans & decisions        │
         │ - Code & artifacts         │
         │ - Metrics & telemetry      │
         │ - Real-time sync           │
         └────────────┬───────────────┘
                      │
         ┌────────────┴───────────────┐
         │                            │
         v                            v
┌─────────────────┐        ┌─────────────────┐
│  Git Repository │        │ Next.js         │
│  (Persistence)  │        │ Dashboard       │
└─────────────────┘        └─────────────────┘
```

### 1.2 Flujo Básico

1. **Usuario envía tarea** → Orchestrator analiza
2. **Orchestrator sugiere agente** → muestra reasoning + confianza %
3. **Usuario confirma o override** → learning loop
4. **Agente ejecuta** → escribe resultado a Convex MCP
5. **Si requiere handoff** → siguiente agente lee de Convex
6. **Métricas registradas** → Dashboard actualizado en tiempo real

---

## 2. Orchestrator - Routing Engine

### 2.1 Clasificador de Tareas

```python
class TaskClassifier:
    """Clasifica tareas y recomienda agente óptimo"""

    TASK_TYPES = {
        'planning': {
            'keywords': ['plan', 'design', 'architect', 'strategy', 'approach'],
            'requires_high_input': True,
            'requires_high_output': False,
            'recommended_agent': 'claude',
            'confidence_boost': 0.3
        },
        'code_generation': {
            'keywords': ['create', 'generate', 'implement', 'add', 'build'],
            'requires_high_input': False,
            'requires_high_output': True,
            'recommended_agent': 'chatgpt-pro',
            'confidence_boost': 0.3
        },
        'review': {
            'keywords': ['review', 'analyze', 'check', 'validate', 'audit'],
            'requires_high_input': True,
            'requires_high_output': False,
            'recommended_agent': 'claude',
            'confidence_boost': 0.25
        },
        'refactoring': {
            'keywords': ['refactor', 'rename', 'move', 'restructure', 'reorganize'],
            'requires_high_input': True,
            'requires_high_output': True,
            'recommended_agent': 'chatgpt-pro',
            'confidence_boost': 0.2
        },
        'debugging': {
            'keywords': ['debug', 'fix', 'bug', 'error', 'broken'],
            'requires_high_input': True,
            'requires_high_output': False,
            'recommended_agent': 'claude',
            'confidence_boost': 0.25
        }
    }
```

### 2.2 Sistema de Scoring

Para cada tarea, calcula score (0-100) para ambos agentes:

**Claude Score:**
```
Base: 50
+ 30 si detecta keywords de 'planning' o 'review'
+ 20 si codebase grande (requiere leer mucho contexto)
+ 15 si decisiones arquitectónicas involucradas
+ 10 basado en éxito histórico en tareas similares
```

**ChatGPT Pro Score:**
```
Base: 50
+ 30 si detecta keywords de 'code_generation'
+ 25 si genera >200 líneas de código estimadas
+ 15 si es boilerplate/repetitivo
+ 10 basado en éxito histórico
```

### 2.3 Output al Usuario

```
📋 Tarea: "Add JWT authentication to user API"

🤖 Análisis:
  Tipo detectado: Planning + Code Generation (híbrido)
  Input context: Medium (leer API existente)
  Output size: High (nuevo módulo auth)

💡 Sugerencia: Workflow secuencial
  1. Claude (confianza: 78%) - Planear arquitectura auth
  2. ChatGPT Pro (confianza: 85%) - Generar código JWT
  3. Claude (confianza: 70%) - Review e integración

Ahorro estimado: $2.40 vs. solo Claude
Tiempo estimado: 15 min

[✓ Proceder] [✎ Override] [? Explicar más]
```

### 2.4 Learning Loop

Cada decisión de routing se registra en Convex:

```typescript
{
  task_description: string;
  suggested_agent: 'claude' | 'chatgpt-pro';
  confidence: number;
  user_override?: 'claude' | 'chatgpt-pro';
  actual_agent_used: 'claude' | 'chatgpt-pro';
  outcome_success: boolean;
  execution_time_ms: number;
  cost_usd: number;
}
```

Sistema aprende de overrides y outcomes para mejorar precisión.

**Métricas de learning:**
- Accuracy inicial: ~75%
- Target accuracy post-training (2 semanas): >90%
- Learning rate: +5-10% accuracy por semana

---

## 3. MCP Server con Convex

### 3.1 Por Qué Convex

- ✅ **Real-time reactivity**: Ambos agentes ven cambios instantáneamente
- ✅ **TypeScript end-to-end**: Type-safe entre cliente y servidor
- ✅ **Persistencia automática**: No necesitas Redis + disco separados
- ✅ **Queries reactivas**: Dashboard actualizado en tiempo real sin polling
- ✅ **Ya integrado**: Proyecto "amd" usa Convex

### 3.2 Schema Convex

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Sesiones de trabajo
  sessions: defineTable({
    project_path: v.string(),
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused")
    ),
  }).index("by_status", ["status"]),

  // Planes (escritos por Claude)
  plans: defineTable({
    session_id: v.id("sessions"),
    content: v.string(),
    created_by: v.literal("claude"),
    created_at: v.number(),
    tasks: v.array(v.object({
      id: v.string(),
      description: v.string(),
      assigned_to: v.union(v.literal("claude"), v.literal("chatgpt-pro")),
      status: v.string(),
    })),
  }).index("by_session", ["session_id"]),

  // Artifacts (código generado)
  artifacts: defineTable({
    session_id: v.id("sessions"),
    plan_id: v.id("plans"),
    type: v.union(
      v.literal("code"),
      v.literal("test"),
      v.literal("config")
    ),
    file_path: v.string(),
    content: v.string(),
    created_by: v.union(v.literal("claude"), v.literal("chatgpt-pro")),
    created_at: v.number(),
    status: v.union(
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    review_notes: v.optional(v.string()),
  }).index("by_session", ["session_id"])
    .index("by_status", ["status"]),

  // Métricas en tiempo real
  metrics: defineTable({
    session_id: v.id("sessions"),
    timestamp: v.number(),
    agent: v.union(v.literal("claude"), v.literal("chatgpt-pro")),
    tokens_consumed: v.number(),
    cost_usd: v.number(),
    task_type: v.string(),
    execution_time_ms: v.number(),
  }).index("by_session", ["session_id"])
    .index("by_timestamp", ["timestamp"]),

  // Decisiones de routing (para learning)
  routing_decisions: defineTable({
    session_id: v.id("sessions"),
    task_description: v.string(),
    suggested_agent: v.union(v.literal("claude"), v.literal("chatgpt-pro")),
    confidence: v.number(),
    user_override: v.optional(v.union(
      v.literal("claude"),
      v.literal("chatgpt-pro")
    )),
    actual_agent_used: v.union(v.literal("claude"), v.literal("chatgpt-pro")),
    outcome_success: v.boolean(),
  }).index("by_session", ["session_id"]),
});
```

### 3.3 Mutations Clave

```typescript
// convex/mcp.ts

export const writePlan = mutation({
  args: {
    session_id: v.id("sessions"),
    content: v.string(),
    tasks: v.array(/* ... */),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("plans", {
      ...args,
      created_by: "claude",
      created_at: Date.now(),
    });
  },
});

export const writeArtifact = mutation({
  args: {
    session_id: v.id("sessions"),
    plan_id: v.id("plans"),
    type: v.union(/* ... */),
    file_path: v.string(),
    content: v.string(),
    created_by: v.union(/* ... */),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("artifacts", {
      ...args,
      created_at: Date.now(),
      status: "pending_review",
    });
  },
});

export const recordMetric = mutation({
  args: {
    session_id: v.id("sessions"),
    agent: v.union(/* ... */),
    tokens_consumed: v.number(),
    cost_usd: v.number(),
    task_type: v.string(),
    execution_time_ms: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("metrics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
```

### 3.4 Queries Reactivas

```typescript
export const getActivePlan = query({
  args: { session_id: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_session", (q) => q.eq("session_id", args.session_id))
      .order("desc")
      .first();
  },
});

export const getPendingArtifacts = query({
  args: { session_id: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifacts")
      .withIndex("by_session", (q) => q.eq("session_id", args.session_id))
      .filter((q) => q.eq(q.field("status"), "pending_review"))
      .collect();
  },
});

export const getSessionMetrics = query({
  args: { session_id: v.id("sessions") },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query("metrics")
      .withIndex("by_session", (q) => q.eq("session_id", args.session_id))
      .collect();

    const claude_tokens = metrics
      .filter(m => m.agent === "claude")
      .reduce((sum, m) => sum + m.tokens_consumed, 0);

    const chatgpt_tokens = metrics
      .filter(m => m.agent === "chatgpt-pro")
      .reduce((sum, m) => sum + m.tokens_consumed, 0);

    const total_cost = metrics.reduce((sum, m) => sum + m.cost_usd, 0);

    return {
      claude_tokens,
      chatgpt_tokens,
      total_cost,
      total_time_ms: metrics.reduce((sum, m) => sum + m.execution_time_ms, 0),
    };
  },
});
```

---

## 4. Integración con ChatGPT Pro (Sin API)

### 4.1 Por Qué ChatGPT Pro Web Interface

**Ventajas:**
- ✅ **$0 costo adicional** (incluido en suscripción $20/mes)
- ✅ **GPT-4 Turbo** más reciente
- ✅ **Sin límites de tokens** (dentro de límites razonables de Pro)
- ✅ **Ahorro masivo**: 46% vs. usar API de OpenAI

**Desventajas (mitigables):**
- ⚠️ Latencia: ~5-10s vs. 2s de API (aceptable para tareas largas)
- ⚠️ Menos control sobre parámetros (temperature, max_tokens)

### 4.2 Cliente Playwright

```typescript
// src/agents/chatgpt-pro-client.ts

import { chromium, Browser, Page } from 'playwright';

export class ChatGPTProClient {
  private browser?: Browser;
  private page?: Page;
  private isAuthenticated = false;

  async initialize() {
    // Launch browser con contexto persistente (mantiene sesión)
    this.browser = await chromium.launchPersistentContext(
      './data/chatgpt-session',
      {
        headless: true,
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    );

    this.page = this.browser.pages()[0] || await this.browser.newPage();

    await this.page.goto('https://chat.openai.com');
    await this.page.waitForLoadState('networkidle');

    this.isAuthenticated = await this.checkAuthentication();

    if (!this.isAuthenticated) {
      throw new Error('Please login to ChatGPT Pro manually first');
    }
  }

  private async checkAuthentication(): Promise<boolean> {
    const chatInput = await this.page?.locator('textarea[placeholder*="Message"]').count();
    return (chatInput ?? 0) > 0;
  }

  async executeTask(task: string, context?: string): Promise<string> {
    if (!this.page) throw new Error('Not initialized');

    // Start new chat
    await this.page.click('button[aria-label*="New chat"]');
    await this.page.waitForTimeout(1000);

    // Build prompt
    const fullPrompt = context
      ? `Context:\n${context}\n\nTask:\n${task}`
      : task;

    // Type and send
    const textarea = this.page.locator('textarea[placeholder*="Message"]');
    await textarea.fill(fullPrompt);
    await this.page.keyboard.press('Enter');

    // Wait for complete response
    await this.page.waitForSelector('[data-message-author-role="assistant"]', {
      timeout: 120000
    });

    await this.page.waitForSelector('.result-streaming', {
      state: 'detached',
      timeout: 120000
    });

    // Extract response
    const response = await this.page
      .locator('[data-message-author-role="assistant"]')
      .last()
      .innerText();

    const codeBlocks = await this.page
      .locator('[data-message-author-role="assistant"] code')
      .allInnerTexts();

    return this.formatResponse(response, codeBlocks);
  }

  private formatResponse(text: string, codeBlocks: string[]): string {
    let result = text;

    if (codeBlocks.length > 0) {
      result += '\n\n---CODE GENERATED---\n';
      result += codeBlocks.join('\n\n');
    }

    return result;
  }

  async close() {
    await this.browser?.close();
  }
}
```

### 4.3 Setup Inicial (Una Sola Vez)

```bash
# 1. Instalar Playwright
npm install playwright

# 2. Login manual (headful browser)
node scripts/setup-chatgpt-auth.js
```

```javascript
// scripts/setup-chatgpt-auth.js
const { chromium } = require('playwright');

(async () => {
  const context = await chromium.launchPersistentContext(
    './data/chatgpt-session',
    {
      headless: false,
      viewport: { width: 1280, height: 720 }
    }
  );

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://chat.openai.com');

  console.log('✋ Por favor, inicia sesión manualmente.');
  console.log('⏱️  Una vez logueado, presiona Enter...');

  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('✅ Sesión guardada!');
  await context.close();
})();
```

---

## 5. Workflow de Feature Development End-to-End

### 5.1 Ejemplo: "Add email notification system"

**Fase 1: Planning (Claude - 3 min, $0.45)**

```
Usuario: "Add email notification system to user dashboard"

Orchestrator:
✓ Análisis: Planning task (high input context)
✓ Sugerencia: Claude (92% confianza)
✓ Usuario confirma

Claude:
1. Lee codebase (dashboard, user model, stack)
2. Propone arquitectura:
   - Frontend: Email preferences UI
   - Backend: Email service + templates
   - Database: notifications table
   - Third-party: SendGrid
3. Escribe plan detallado → Convex

Plan almacenado:
- 6 subtasks identificadas
- Tasks 1-5: Code generation → ChatGPT Pro
- Task 6: Integration review → Claude

Métricas:
- Tokens: 15,234 (analyzing codebase)
- Costo: $0.45
- Tiempo: 3 min
```

**Fase 2: Implementation (ChatGPT Pro - 4 min, $0)**

```
Orchestrator lee plan → 5 tasks de code generation

Para cada task:
ChatGPT Pro:
1. Lee plan + context de Convex
2. Genera código:
   - services/email_service.py (120 LOC)
   - templates/notification_email.html
   - config/sendgrid.py
   - components/EmailPreferences.tsx
   - etc.
3. Escribe artifacts → Convex (pending_review)

Total generado:
- 8 archivos
- ~600 líneas
- Costo: $0 (incluido en Pro subscription)
- Tiempo: 4 min
```

**Fase 3: Review (Claude - 2 min, $0.52)**

```
Orchestrator: Task 6 - Integration review

Claude:
1. Lee todos artifacts de Convex
2. Verifica:
   ✓ Código sigue convenciones
   ✓ Integración correcta
   ✓ Error handling
   ✗ Falta validación email
   ✗ Tests incompletos

3. Actualiza artifacts:
   - 6/8 → "approved"
   - 2/8 → "rejected" con notas

4. Crea 2 nuevas tasks:
   - "Add email validation" → ChatGPT Pro
   - "Complete unit tests" → ChatGPT Pro

Métricas:
- Tokens: 18,920 (reviewing 600 LOC)
- Costo: $0.52
- Tiempo: 2 min
```

**Fase 4: Fixes (ChatGPT Pro - 2 min, $0)**

```
ChatGPT Pro arregla → Claude re-revisa → Todo approved

Resultado final:
✅ Feature completa en 11 minutos
✅ Costo total: $0.97
✅ Ahorro vs. solo Claude: $3.43 (78%)
✅ Git commit automático
```

---

## 6. Dashboard de Observabilidad

### 6.1 Página Next.js

Nueva ruta: `/app/src/app/orchestrator/page.tsx`

**Componentes principales:**

```typescript
'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function OrchestratorDashboard() {
  const activeSessions = useQuery(api.mcp.getActiveSessions);
  const todayMetrics = useQuery(api.mcp.getTodayMetrics);
  const routingStats = useQuery(api.mcp.getRoutingStats, { days: 7 });
  const costAnalysis = useQuery(api.mcp.getCostAnalysis, { days: 30 });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Features Hoy"
          value={todayMetrics?.features_completed}
          trend="+23%"
        />
        <StatCard
          title="Ahorro 30d"
          value={`$${costAnalysis?.savings_usd.toFixed(2)}`}
          trend="+$127"
        />
        <StatCard
          title="Routing Accuracy"
          value={`${routingStats?.accuracy_pct.toFixed(1)}%`}
        />
        <StatCard
          title="Velocity"
          value={`${todayMetrics?.avg_feature_time_min.toFixed(0)} min`}
        />
      </div>

      {/* Sesión activa en tiempo real */}
      {activeSessions?.length > 0 && (
        <SessionTimeline session={activeSessions[0]} />
      )}

      {/* Análisis de costos */}
      <div className="grid grid-cols-2 gap-6">
        <CostSavingsCard data={costAnalysis} />
        <TokenChart data={routingStats?.daily_tokens} />
      </div>

      {/* Routing Intelligence */}
      <RoutingAccuracyChart data={routingStats} />

      {/* Histórico */}
      <SessionHistoryTable sessions={recentSessions} />
    </div>
  );
}
```

### 6.2 Métricas en Tiempo Real

Convex push updates → Dashboard re-renderiza automáticamente:

- **Latencia < 100ms** para updates
- **WebSocket** manejado por Convex
- **Sin polling manual** necesario

**KPIs principales:**
- Features completadas hoy
- Ahorro acumulado (30 días)
- Routing accuracy (% sugerencias aceptadas)
- Velocity (minutos por feature)
- Tokens consumidos por agente
- Learning rate (mejora semanal)

---

## 7. Análisis de Costos

### 7.1 Comparación Económica

**Escenario base: 100 features por mes**

| Estrategia | Claude | Codex/ChatGPT | Total | Ahorro |
|------------|--------|---------------|-------|--------|
| **Solo Claude (API)** | $285 | - | $285 | - |
| **Claude + Codex API** | $135 | $100 | $235 | 17% |
| **Claude + ChatGPT Pro** | $135 | $20 | **$155** | **46%** 🎉 |

**Desglose Claude + ChatGPT Pro:**

```
Claude (Planning + Review):
- Planning: 100 × 20k tokens × $0.003 = $60
- Review: 100 × 25k tokens × $0.003 = $75
Total Claude: $135/mes

ChatGPT Pro (Implementation):
- Flat subscription: $20/mes
- Unlimited usage (dentro de límites razonables)
Total ChatGPT Pro: $20/mes

TOTAL: $155/mes
AHORRO: $130/mes (46% vs. solo Claude)
```

### 7.2 ROI en Diferentes Volúmenes

| Features/mes | Solo Claude | Claude + ChatGPT Pro | Ahorro |
|--------------|-------------|---------------------|--------|
| 50 | $142 | $88 | $54 (38%) |
| 100 | $285 | $155 | $130 (46%) |
| 200 | $570 | $290 | $280 (49%) |
| 500 | $1,425 | $695 | $730 (51%) |

**Conclusión**: A mayor volumen, mayor % de ahorro (asintótico a ~51%).

---

## 8. Error Handling y Resilencia

### 8.1 Tipos de Errores Manejados

```typescript
// 1. Agent Failures
- Retry con exponential backoff (3 intentos)
- Fallback al otro agente si posible
- Notificación al usuario si todo falla

// 2. MCP/Convex Connection Issues
- Queue operations localmente
- Sync cuando conexión se restaura
- Nunca perder trabajo en progreso

// 3. Routing Errors
- User override siempre disponible
- Feedback registrado para learning
- Degradar a manual mode si accuracy < 60%

// 4. Cost Limit Exceeded
- Alertas al 80% del límite mensual
- Pausa automática si se excede
- Sugerencia de optimización

// 5. Git Conflicts
- Detección antes de commit
- Sugerencia de resolución a Claude
- User approval required
```

### 8.2 Ejemplo de Retry Logic

```typescript
async function executeWithRetry(
  agent: 'claude' | 'chatgpt-pro',
  task: Task,
  maxRetries: number = 3
): Promise<Result> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await agents[agent].execute(task);

      await convex.mutation(api.mcp.recordMetric, {
        session_id: currentSession,
        agent,
        success: true,
        attempt_number: attempt,
      });

      return result;

    } catch (error) {
      logger.error(`${agent} failed (attempt ${attempt}/${maxRetries})`);

      if (attempt === maxRetries) {
        // Try fallback agent
        const fallbackAgent = agent === 'claude' ? 'chatgpt-pro' : 'claude';

        if (canFallback(task, fallbackAgent)) {
          return await agents[fallbackAgent].execute(task);
        }

        // Notify user
        await notifyUser({
          type: 'error',
          message: `Task failed after ${maxRetries} attempts`,
          task,
        });

        throw error;
      }

      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

---

## 9. Testing Strategy

### 9.1 Test Suites

```typescript
// tests/orchestrator.test.ts

describe('Orchestrator', () => {
  describe('Routing', () => {
    it('routes planning to Claude', async () => {
      const task = { description: 'Design auth architecture' };
      const suggestion = await orchestrator.suggestAgent(task);

      expect(suggestion.agent).toBe('claude');
      expect(suggestion.confidence).toBeGreaterThan(0.8);
    });

    it('routes code gen to ChatGPT Pro', async () => {
      const task = { description: 'Generate CRUD endpoints' };
      const suggestion = await orchestrator.suggestAgent(task);

      expect(suggestion.agent).toBe('chatgpt-pro');
    });

    it('handles user overrides and learns', async () => {
      const result = await orchestrator.execute(task, {
        override: 'claude',
        reason: 'Needs deeper analysis'
      });

      expect(result.agent_used).toBe('claude');

      const decision = await convex.query(api.mcp.getLastRoutingDecision);
      expect(decision.user_override).toBe('claude');
    });
  });

  describe('MCP Integration', () => {
    it('syncs plan to Convex', async () => {
      const plan = await claude.createPlan(task);
      const plan_id = await orchestrator.syncPlan(plan);

      const stored = await convex.query(api.mcp.getPlan, { plan_id });
      expect(stored.content).toBe(plan.content);
    });
  });

  describe('Cost Tracking', () => {
    it('tracks tokens and costs accurately', async () => {
      await claude.execute(task1); // 10k tokens
      await chatgpt.execute(task2); // 5k tokens, $0

      const metrics = await convex.query(api.mcp.getSessionMetrics);

      expect(metrics.claude_tokens).toBe(10000);
      expect(metrics.chatgpt_tokens).toBe(5000);
      expect(metrics.chatgpt_cost).toBe(0); // ChatGPT Pro = free
    });
  });
});
```

---

## 10. Deployment

### 10.1 Estructura del Proyecto

```
projects/orchestrator/
├── convex/
│   ├── schema.ts
│   └── mcp.ts
├── src/
│   ├── orchestrator/
│   │   ├── routing-engine.ts
│   │   ├── agent-executor.ts
│   │   └── cost-tracker.ts
│   ├── agents/
│   │   ├── claude-client.ts
│   │   └── chatgpt-pro-client.ts
│   └── cli.ts
├── scripts/
│   └── setup-chatgpt-auth.js
├── tests/
├── .env.example
└── package.json
```

### 10.2 Variables de Entorno

```bash
# .env.example

# API Keys
CLAUDE_API_KEY=sk-ant-***
# NO SE NECESITA: OPENAI_API_KEY (usamos ChatGPT Pro web)

# Convex
CONVEX_URL=https://your-deployment.convex.cloud

# Cost Management
MONTHLY_BUDGET_USD=200
ALERT_THRESHOLD_PCT=80

# Routing
AUTO_ROUTING_ENABLED=true
MIN_CONFIDENCE_FOR_AUTO=0.75
ENABLE_LEARNING=true

# ChatGPT Pro
CHATGPT_SESSION_DIR=./data/chatgpt-session
```

### 10.3 Setup Steps

```bash
# 1. Deploy Convex
npx convex deploy

# 2. Setup ChatGPT Pro authentication (una sola vez)
node scripts/setup-chatgpt-auth.js

# 3. Install orchestrator CLI
npm install -g ./projects/orchestrator

# 4. Initialize
orchestrator init

# 5. Start session
orchestrator start
```

---

## 11. Métricas de Éxito

### 11.1 KPIs Técnicos

- ✅ **Routing accuracy**: >90% después de 2 semanas
- ✅ **Uptime**: >99% (error handling robusto)
- ✅ **Latency**: <10s por task en promedio
- ✅ **Data integrity**: 100% de plans/artifacts sincronizados

### 11.2 KPIs de Negocio

- ✅ **Ahorro de costos**: >40% vs. baseline (solo Claude)
- ✅ **Velocity**: Features 2x más rápido
- ✅ **Quality**: No regression en bugs introducidos
- ✅ **ROI**: Payback en <2 semanas

### 11.3 Seguimiento Continuo

Dashboard Next.js muestra en tiempo real:
- Costo acumulado mensual vs. budget
- Accuracy de routing (trending)
- Ahorro acumulado vs. baseline
- Velocity (features por semana)
- Learning rate (mejora en accuracy)

---

## 12. Roadmap de Implementación

### Fase 1: MVP (Semana 1-2)

- [ ] Setup Convex con schema básico
- [ ] Implementar routing engine simple
- [ ] Integrar Claude API client
- [ ] Integrar ChatGPT Pro Playwright client
- [ ] CLI básico para ejecutar tasks
- [ ] Métricas simples (tokens, costo)

### Fase 2: Orchestration (Semana 3)

- [ ] Workflow secuencial Claude → ChatGPT → Claude
- [ ] MCP sync completo (plans, artifacts, metrics)
- [ ] User override interface
- [ ] Learning loop básico

### Fase 3: Dashboard (Semana 4)

- [ ] Dashboard Next.js integrado
- [ ] Queries reactivas de Convex
- [ ] Visualizaciones de costos, tokens, accuracy
- [ ] Sesiones en tiempo real

### Fase 4: Optimización (Semana 5+)

- [ ] Mejora de accuracy de routing con ML
- [ ] Paralelización de tasks independientes
- [ ] Alertas proactivas de costos
- [ ] A/B testing de estrategias de routing

---

## 13. Referencias

- **Convex Documentation**: https://docs.convex.dev
- **Playwright Automation**: https://playwright.dev
- **Claude API**: https://docs.anthropic.com
- **PDF fuente**: "Maximizar Claude Code y Codex.pdf" (análisis económico)

---

**Documento validado**: 2026-02-01
**Autor**: AIAIAI Consulting + Claude Sonnet 4.5
**Próximo paso**: Crear worktree aislado e implementar Fase 1 (MVP)
