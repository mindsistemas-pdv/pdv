import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase } from './database/connection'
import { registerProductHandlers } from './ipc/productHandlers'
import { registerSaleHandlers } from './ipc/saleHandlers'
import { registerCashRegisterHandlers } from './ipc/cashRegisterHandlers'
import { registerAuthHandlers } from './ipc/authHandlers'

// Em dev, o Vite roda na porta 5173
// Em produção, carrega o index.html do build
const isDev = !app.isPackaged

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
      sandbox: false, // necessário para o preload acessar módulos Node (contextBridge)
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
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
