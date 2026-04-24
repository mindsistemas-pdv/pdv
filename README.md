# MindSys PDV

Sistema de Ponto de Venda desktop — Mind Sistemas.

## Stack

- **Electron** — aplicação desktop
- **React + TypeScript** — interface
- **Tailwind CSS** — estilização
- **SQLite (better-sqlite3)** — banco local

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

> Inicia o Vite (porta 5173) e o Electron em paralelo.

## Usuário padrão

| Usuário | Senha    |
|---------|----------|
| admin   | admin123 |

## Estrutura

```
electron/           # Processo principal (Node.js)
  database/         # Conexão e migrations SQLite
  ipc/              # Handlers de comunicação IPC
  repositories/     # Acesso ao banco de dados
  types/            # Tipos TypeScript compartilhados

src/                # Renderer (React)
  components/       # Componentes reutilizáveis
  contexts/         # Estado global (Auth, CashRegister)
  layouts/          # Layout principal
  pages/            # Páginas da aplicação
  types/            # Tipos do renderer
  utils/            # Utilitários (formatação, etc.)
```

## Atalhos de teclado (PDV)

| Tecla | Ação              |
|-------|-------------------|
| F5    | Finalizar venda   |
| F9    | Cancelar venda    |
| Esc   | Focar no campo    |
| Enter | Adicionar produto |
