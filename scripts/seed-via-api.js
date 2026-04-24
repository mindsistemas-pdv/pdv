/**
 * Seed via HTTP — chama a API do Electron enquanto o app está rodando.
 * 
 * Como usar:
 * 1. Abra o app com npm start
 * 2. Em outro terminal, rode: node scripts/seed-via-api.js
 * 
 * Alternativa mais simples: use o botão "Seed" que aparece nas configurações do app.
 */

// Na verdade, vamos usar uma abordagem diferente:
// Injetar os dados diretamente via IPC usando um script Electron separado.
console.log('Use o menu de configurações do app para carregar os dados de exemplo.')
console.log('Ou rode: npm run seed')
