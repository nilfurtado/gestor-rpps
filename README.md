# SANPREV — Sistema de Gestão de Arrecadação Previdenciária

Sistema interno da **Santana Previdência** (Divisão de Arrecadação) para controle dos lançamentos mensais da folha previdenciária dos entes municipais vinculados ao RPPS.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** + shadcn/ui (componentes inline) + Radix
- **Prisma 6** + **MySQL / MariaDB**
- **Auth.js v5** (NextAuth) com credentials provider
- **Recharts** (dashboard), **@react-pdf/renderer** (PDFs), **ExcelJS** (XLSX)
- **next-themes** (dark/light mode)

## Pré-requisitos

- Node.js **20.9+**
- MySQL 8 ou MariaDB 10.6+ rodando localmente
- Crie um banco vazio, ex.: `CREATE DATABASE sanprev CHARACTER SET utf8mb4;`

## Setup local

```bash
# 1) instalar dependências
npm install

# 2) copiar variáveis de ambiente
cp .env.example .env
# edite .env com a string de conexão do seu MySQL local

# 3) criar tabelas
npm run prisma:migrate    # 1ª vez: aceita o nome "init"
# (alternativa rápida sem migrations: npm run prisma:push)

# 4) popular dados iniciais (órgãos, competências, exercício atual e admin)
npm run prisma:seed

# 5) rodar
npm run dev
```

A aplicação sobe em [http://localhost:3000](http://localhost:3000). Acesse com as credenciais exibidas pelo seed (por padrão `admin@sanprev.local` / `sanprev2026`).

## Scripts úteis

| Comando                   | Ação                                              |
| ------------------------- | ------------------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento (Turbopack)           |
| `npm run build`           | Build de produção                                 |
| `npm run start`           | Servidor de produção                              |
| `npm run prisma:generate` | Gera o Prisma Client                              |
| `npm run prisma:migrate`  | Cria/aplica migrations                            |
| `npm run prisma:push`     | Aplica o schema sem criar migration               |
| `npm run prisma:seed`     | Roda `prisma/seed.ts` (órgãos/competências/admin) |
| `npm run prisma:studio`   | Abre o Prisma Studio (interface visual do BD)     |

## Estrutura

```
src/
  app/
    (auth)/login/              # login institucional
    (dashboard)/
      dashboard/               # KPIs + 4 charts
      orgaos/                  # CRUD órgãos
      lancamentos/             # tabela com filtros + form novo
      relatorios/              # hub + 6 relatórios
    api/
      auth/[...nextauth]/
      orgaos/                  # GET + POST + [id] PATCH/DELETE
      lancamentos/             # idem
      relatorios/[tipo]/pdf/   # geração PDF
      relatorios/[tipo]/xlsx/  # geração XLSX
  components/
    brand/logo.tsx             # Logo SANPREV (full + mark)
    dashboard/                 # KPIs + Recharts
    lancamentos/status-badge.tsx
    reports/                   # filters + view
    shell/                     # sidebar + topbar
    ui/                        # shadcn-style primitives
  lib/
    auth.ts                    # NextAuth v5
    calc/lancamento.ts         # déficit, inadimplência, status
    dashboard.ts               # queries agregadas
    reports.ts                 # builder dos 6 relatórios
    audit.ts                   # log de auditoria
  proxy.ts                     # proteção de rotas (substituto do middleware no Next 16)
prisma/
  schema.prisma                # 5 tabelas + 4 enums + AuditLog
  seed.ts                      # órgãos, competências, exercício, admin
public/
  logo-sanprev.svg             # logo full institucional (login + relatórios)
  logo-sanprev-mark.svg        # apenas brasão (favicon, sidebar)
```

## Regras de negócio aplicadas

- **Cálculo automático**: `deficit = valorRecolher − valorRecolhido` e `inadimplencia = (deficit/valorRecolher) × 100`. Esses campos são recalculados no servidor a cada CREATE/UPDATE e nunca aceitos do cliente.
- **Status**: Pago (recolhido ≥ a recolher) · Parcial (recolhido > 0 e < a recolher) · Inadimplente (recolhido = 0) · Parcelado (flag manual).
- **Anti-duplicidade**: índice único `(orgao, tipo, exercicio, competencia)` no banco + mensagem amigável na API.
- **Bloqueio de exercício encerrado**: APIs rejeitam mutação quando `exercicio.status = ENCERRADO`.
- **Auditoria**: toda mutação registra `AuditLog` com `before/after` em JSON.
- **Autenticação**: NextAuth v5 + bcrypt. Sessão JWT em cookie httpOnly. Rotas protegidas via `src/proxy.ts` (substituto do `middleware.ts` no Next.js 16).

## Identidade visual

- Verde institucional `#0F5132` como `--primary`, verde claro `#86C232` (selo "CIDADE MELHOR COM AJUDA DE TODOS") como `--accent`.
- Logo SANPREV em SVG vetorial — usada em **login**, **cabeçalho do app** (sidebar) e **cabeçalho dos relatórios PDF**.
- Tokens semânticos para Pago (verde), Parcial (amarelo), Inadimplente (vermelho), Parcelado (azul). Status sempre acompanhado de ícone + texto (regra de acessibilidade WCAG).
- Dark mode com paridade de contraste (4.5:1+ verificado).
- Tipografia: **Inter** (Google Fonts) com numerais tabulares em colunas monetárias.

## Deploy em produção

1. Criar banco MySQL na hospedagem
2. Configurar `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` no ambiente
3. Rodar `npm run build && npm run prisma:migrate deploy`
4. Subir com `npm run start` (preferencialmente sob PM2 + Nginx, ou via VPS Node)

## Próximos passos recomendados

- Implementar perfis (Gestor / Operador / Auditor) e middleware de autorização granular
- Tela de visualização do AuditLog
- Backup diário automatizado do MySQL (cron na infraestrutura)
- Notificação por e-mail de vencimentos próximos
- Internalização da logo oficial da SANPREV (substituir `public/logo-sanprev.svg` pelo SVG oficial recebido da comunicação institucional)
