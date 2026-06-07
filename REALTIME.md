# 📡 Sistema de Comunicação em Tempo Real (SSE)

## O que é?

**Server-Sent Events (SSE)** é um sistema que permite o servidor enviar atualizações ao cliente automaticamente quando dados mudam no banco de dados.

Diferente do polling (cliente consultando a cada X segundos), SSE é **push do servidor** → cliente conectado recebe notificação **instantaneamente**.

## Arquitetura

```
┌─────────────────────────────────────────┐
│         Browser (Cliente)                │
│  ┌───────────────────────────────────┐  │
│  │ useRealtimeUpdates Hook           │  │
│  │ (conecta em /api/relatorios/...)  │  │
│  └──────────────────┬────────────────┘  │
│                     │ EventSource        │
│                     │ (WebSocket-like)   │
└─────────────────────┼────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│     Next.js Server                       │
│  ┌───────────────────────────────────┐  │
│  │ /api/relatorios/updates/route.ts  │  │
│  │ (Endpoint SSE)                    │  │
│  │ - Gerencia conexões abertas       │  │
│  │ - Envia keep-alive a cada 30s     │  │
│  └──────────────────┬────────────────┘  │
│                     │                    │
│  ┌──────────────────▼────────────────┐  │
│  │ broadcastUpdate() em:             │  │
│  │ - POST /api/lancamentos           │  │
│  │ - POST /api/acordos               │  │
│  │ (dispara quando dados mudam)      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         ▼
      SQLite/MySQL
```

## Como Usar em um Componente

### 1. **Importar o Hook**

```tsx
import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
```

### 2. **Conectar na sua UI**

```tsx
"use client";

import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
import { useState } from "react";

export function MeuRelatorio() {
  const [data, setData] = useState(null);

  // Hook monitora atualizações
  useRealtimeUpdates((update) => {
    console.log("Dados atualizados:", update);
    // Recarregar dados do servidor aqui
    recarregarDados();
  });

  return (
    <div>
      {/* seu relatório aqui */}
    </div>
  );
}
```

### 3. **Exemplo Completo**

```tsx
"use client";

import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
import { useState, useEffect } from "react";

export function RelatorioMensal() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para recarregar dados
  const recarregarDados = async (filtros) => {
    const response = await fetch(`/api/relatorios/mensal?${new URLSearchParams(filtros)}`);
    const novosDados = await response.json();
    setDados(novosDados);
  };

  // Carregar dados iniciais
  useEffect(() => {
    recarregarDados({ exercicioId: "17", competenciaId: "6" });
  }, []);

  // Monitorar atualizações em tempo real
  const { connected } = useRealtimeUpdates((update) => {
    // Quando novo lançamento é criado, recarregar
    if (update.type === "lancamento") {
      recarregarDados({ exercicioId: "17", competenciaId: "6" });
    }
  });

  return (
    <div>
      <p>{connected ? "🟢 Online" : "🔴 Offline"}</p>
      {dados && <RenderRelatorio dados={dados} />}
    </div>
  );
}
```

## Tipos de Eventos

```typescript
type UpdateType = "lancamento" | "acordo" | "orgao" | "exercicio";
type UpdateAction = "created" | "updated" | "deleted";

interface RealtimeUpdate {
  type: UpdateType;
  action: UpdateAction;
  timestamp: string;
}
```

### Exemplos de Eventos:

```json
{
  "type": "lancamento",
  "action": "created",
  "timestamp": "2026-06-07T14:30:45.123Z"
}

{
  "type": "acordo",
  "action": "updated",
  "timestamp": "2026-06-07T14:35:12.456Z"
}
```

## Integração em Endpoints Existentes

Para adicionar broadcast quando dados mudam, importe e chame:

```typescript
import { broadcastUpdate } from "@/app/api/relatorios/updates/route";

// Em qualquer rota POST/PUT/DELETE
await prisma.folhaPrevidenciaria.create({ ... });

broadcastUpdate({
  type: "lancamento",
  action: "created",
  timestamp: new Date().toISOString(),
});
```

## Checklist de Implementação

- [x] Endpoint SSE criado (`/api/relatorios/updates`)
- [x] Hook React criado (`useRealtimeUpdates`)
- [x] Integração no POST de lançamentos
- [ ] Integração no PUT/DELETE de lançamentos
- [ ] Integração em POST/PUT/DELETE de acordos
- [ ] Badge de status em relatórios
- [ ] Atualização automática de dados ao receber evento
- [ ] Testes E2E de SSE

## Performance

- **Keep-alive**: 30 segundos (reduz desconexões)
- **Reconexão**: 3 segundos após desconexão
- **Memory**: ~1KB por conexão ativa
- **Bandwidth**: ~100 bytes por atualização

## Debugging

### No Browser Console:

```javascript
// Abrir Console DevTools (F12)
// Vai ver logs:
// "Conectado ao SSE"
// "Dados atualizados: lancamento/created"

// Monitorar tráfego em:
// DevTools → Network → filter "updates"
```

### No Servidor:

```bash
# Ver logs de conexões
npm run dev

# Procurar por:
# "GET /api/relatorios/updates 200"
```

## Próximos Passos

1. Integrar hook em componentes de relatório
2. Adicionar broadcast em todas as operações CRUD
3. Implementar "Últimas atualizações" sidebar
4. Adicionar notificações toast ao atualizar
5. Testar com múltiplos clientes simultâneos
