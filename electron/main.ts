import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase } from './database/connection'
import { registerProductHandlers } from './ipc/productHandlers'
import { registerSaleHandlers } from './ipc/saleHandlers'
import { registerCashRegisterHandlers } from './ipc/cashRegisterHandlers'
import { registerAuthHandlers } from './ipc/authHandlers'

// O vite-plugin-electron injeta VITE_DEV_SERVER_URL em desenvolvimento
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'MindSys PDV',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    // Desenvolvimento: carrega o servidor Vite
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // Produção: carrega o build estático
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()

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
