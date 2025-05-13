import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason } from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import { join, dirname } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import fs from 'fs'
import chalk from 'chalk'
import readline from 'readline'
import yargs from 'yargs'
import { watchFile, unwatchFile } from 'fs'
import { load } from './lib/database.js'
import commandHandler from './handler/command.js'
import eventHandler from './handler/event.js'

// Variables globales
global.opts = new Object(
  Object.entries(
    yargs(process.argv.slice(2)).exitProcess(false).parse()
  ).reduce((obj, [key, value]) => {
    obj[key] = value
    return obj
  }, {})
)

// Rutas y constantes
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
const rl = readline.createInterface(process.stdin, process.stdout)
const { state, saveState } = await useMultiFileAuthState('./auth_info_sessions')

// Cargar database
global.db = load()

// Inicializar Bot
async function startBot() {
  const sock = makeWASocket({
    logger: P({ level: 'error' }),
    printQRInTerminal: true,
    browser: ['Zerotwo-MD', 'Safari', '3.0.0'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'error' }))
    }
  })

  // Load handlers
  sock.commandHandler = commandHandler.bind(sock)
  sock.eventHandler = eventHandler.bind(sock)

  // Evento de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    
    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode
      if (reason === DisconnectReason.badSession) {
        console.log(`Archivo de sesión corrupto, elimina la carpeta auth_info_sessions y escanea nuevamente.`)
        startBot()
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log('Conexión cerrada, reconectando...')
        startBot()
      } else if (reason === DisconnectReason.connectionLost) {
        console.log('Conexión perdida con el servidor, reconectando...')
        startBot()
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log('Conexión reemplazada, se ha abierto una nueva sesión. Por favor, cierra la sesión actual primero.')
        sock.logout()
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Dispositivo cerró sesión, elimina la carpeta auth_info_sessions y escanea nuevamente.`)
        sock.logout()
      } else if (reason === DisconnectReason.restartRequired) {
        console.log('Reinicio requerido, reiniciando...')
        startBot()
      } else if (reason === DisconnectReason.timedOut) {
        console.log('Tiempo de conexión agotado, reconectando...')
        startBot()
      } else {
        console.log(`Razón de desconexión desconocida: ${reason}|${connection}`)
        startBot()
      }
    } else if (connection === 'open') {
      console.log(chalk.green('✓ CONECTADO'))
      console.log(chalk.yellow('⭐ ZEROTWO-MD ESTÁ LISTO PARA USAR'))
    }
  })

  // Guardar credenciales cuando se actualicen
  sock.ev.on('creds.update', saveState)

  // Escuchar mensajes
  sock.ev.on('messages.upsert', async chatUpdate => {
    try {
      const mek = chatUpdate.messages[0]
      if (!mek.message) return
      mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
      if (mek.key && mek.key.remoteJid === 'status@broadcast') return
      if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
      if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
      
      await sock.eventHandler(chatUpdate)
      await sock.commandHandler(chatUpdate)
    } catch (e) {
      console.log(e)
    }
  })

  // Manejar presencia en línea
  sock.ev.on('presence.update', async data => {
    // Implementar manejo de presencia si es necesario
  })

  // Manejar actualizaciones de grupos
  sock.ev.on('groups.update', async groupsUpdate => {
    try {
      for (const group of groupsUpdate) {
        // Manejar actualizaciones de grupos
      }
    } catch (err) {
      console.log(err)
    }
  })

  // Manejar participantes de grupo
  sock.ev.on('group-participants.update', async participantsUpdate => {
    try {
      // Manejar actualizaciones de participantes en grupos
    } catch (err) {
      console.log(err)
    }
  })

  return sock
}

startBot()

// Función para recargar el archivo cuando haya cambios
const pluginFolder = join(__dirname, './plugins')
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}
for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
  try {
    const file = join(pluginFolder, filename)
    const module = await import(file)
    global.plugins[filename] = module.default || module
  } catch (e) {
    console.log(e)
    delete global.plugins[filename]
  }
}

// Recargar archivos cuando detecte cambios
rl.on('line', line => {
  startBot()
})

// Observar archivos principales
watchFile(join(__dirname, 'main.js'), () => {
  unwatchFile(join(__dirname, 'main.js'))
  console.log(chalk.greenBright('► main.js actualizado con éxito!'))
  process.send('reset')
})
