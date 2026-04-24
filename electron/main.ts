import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase } from './database/connection'
import { registerProductHandlers } from './ipc/productHandlers'
import { registerSaleHandlers } from './ipc/saleHandlers'
import { registerCashRegisterHandlers } from './ipc/cashRegisterHandlers'
import { registerAuthHandlers } from './ipc/authHandlers'

// Determina se está em desenvolvimento ou produção
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'MindSys PDV',
    // Remove a barra de menu padrão — PDV não precisa
    autoHideMenuBar: true,
    webPreferences: {
      // Preload expõe APIs seguras para o renderer via contextBridge
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    // Em dev, carrega o servidor Vite
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Em produção, carrega o build estático
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  // Inicializa o banco SQLite antes de qualquer coisa
  initDatabase()

  // Registra todos os handlers IPC (comunicação renderer <-> main)
  registerAuthHandlers()
  registerProductHandlers()
  registerSaleHandlers()
  registerCashRegisterHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
