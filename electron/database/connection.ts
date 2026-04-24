import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

/**
 * Retorna a instância única do banco (singleton).
 * O banco fica em userData para não ser apagado em atualizações.
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Banco de dados não inicializado. Chame initDatabase() primeiro.')
  }
  return db
}

/**
 * Inicializa o banco SQLite.
 * Chamado uma vez no startup do processo principal.
 */
export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'mindsys-pdv.db')
  console.log(`[DB] Banco de dados em: ${dbPath}`)

  db = new Database(dbPath)

  // WAL mode melhora performance de escrita sem bloquear leituras
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  console.log('[DB] Banco inicializado com sucesso.')
}
