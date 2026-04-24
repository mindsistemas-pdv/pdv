/**
 * Script de inicialização do MindSys PDV em desenvolvimento.
 * 1. Compila o TypeScript do Electron
 * 2. Inicia o Vite
 * 3. Aguarda o Vite estar pronto na porta 5173
 * 4. Inicia o Electron
 */

const { spawn, execSync } = require('child_process')
const http = require('http')

// Passo 1: compila o Electron
console.log('[start] Compilando processo principal...')
try {
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' })
  console.log('[start] Compilação concluída.')
} catch (e) {
  console.error('[start] Erro na compilação:', e.message)
  process.exit(1)
}

// Passo 2: inicia o Vite em background
console.log('[start] Iniciando Vite...')
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
})

// Passo 3: aguarda o Vite responder na porta 5173
function waitForVite(retries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      http.get('http://localhost:5173', (res) => {
        console.log('[start] Vite pronto!')
        resolve()
      }).on('error', () => {
        attempts++
        if (attempts >= retries) {
          reject(new Error('Vite não iniciou a tempo.'))
        } else {
          setTimeout(check, 1000)
        }
      })
    }
    setTimeout(check, 2000) // aguarda 2s antes de começar a checar
  })
}

waitForVite().then(() => {
  // Passo 4: inicia o Electron
  console.log('[start] Iniciando Electron...')
  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' },
  })

  electron.on('close', (code) => {
    console.log('[start] Electron encerrado.')
    vite.kill()
    process.exit(code)
  })
}).catch((err) => {
  console.error('[start]', err.message)
  vite.kill()
  process.exit(1)
})

process.on('SIGINT', () => {
  vite.kill()
  process.exit(0)
})
