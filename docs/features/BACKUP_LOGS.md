# Backup & Logs Manager

## Features

- ✅ Criar backups do banco de dados SQLite
- ✅ Listar e visualizar backups com metadados (tamanho, data)
- ✅ Restaurar backups com confirmação de segurança
- ✅ Deletar backups antigos
- ✅ Visualizar logs do sistema com filtros por nível e busca textual
- ✅ Sugestões automáticas de manutenção baseadas em backups e erros

## Acesso

**URL:** `/admin/backup`

**Permissão:** Apenas usuários com role `GESTOR` podem acessar

**Autenticação:** NextAuth

## Estrutura

### Diretórios
- Backups salvos em `./backups/` (raiz do projeto)
- Máximo 8 backups retidos (~2 meses)
- Logs em memória (até 1000 entradas, próxima: persistência em Prisma)

### Componentes
- `BackupTable` - Tabela com ações (restore, delete)
- `LogsViewer` - Viewer com filtros por nível e busca
- `SuggestionsCard` - Sugestões automáticas

### APIs
- `GET /api/admin/backup` - Lista backups
- `POST /api/admin/backup` - Cria novo backup
- `POST /api/admin/backup/{id}/restore` - Restaura backup
- `DELETE /api/admin/backup/{id}/delete` - Deleta backup
- `GET /api/admin/backup/logs` - Lista logs com filtros

## Como Usar

1. Navegue para `/admin/backup`
2. Clique em "Novo Backup" para criar backup
3. Veja sugestões de manutenção no card "Sugestões"
4. Filtre e busque logs em "Logs do Sistema"
5. Restaure ou delete backups conforme necessário

## Próximas Melhorias

- Persistência de logs em Prisma
- Download de backup via HTTP
- Agendamento automático de backups
- Alertas por email
