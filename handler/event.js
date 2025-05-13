import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const eventsFolder = path.join(__dirname, '../events')

export default async function eventHandler(chatUpdate) {
  try {
    const m = chatUpdate.messages[0]
    if (!m) return
    
    // Información básica del mensaje
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    const sender = m.key.fromMe ? (this.user.id.split(':')[0]+'@s.whatsapp.net' || this.user.id) : (m.key.participant || m.key.remoteJid)
    const pushname = m.pushName || 'Sin Nombre'
    
    // Check if events directory exists, if not create it
    if (!fs.existsSync(eventsFolder)) {
      fs.mkdirSync(eventsFolder, { recursive: true })
    }
    
    // Obtener los archivos de eventos
    try {
      const files = fs.readdirSync(eventsFolder).filter(file => file.endsWith('.js'))
      
      // Cargar y ejecutar cada evento
      for (let file of files) {
        const eventPath = path.join(eventsFolder, file)
        const event = await import(`file://${eventPath}`)
        
        if (event.default && typeof event.default === 'function') {
          await event.default({
            m,
            chatUpdate,
            isGroup,
            sender,
            pushname,
            sock: this
          })
        }
      }
    } catch (e) {
      // Si no hay eventos o hay un error al cargarlos, simplemente continuar
      if (!e.message.includes('no such file or directory')) {
        console.error('Error en el manejador de eventos:', e)
      }
    }
  } catch (e) {
    console.error('Error en el manejador principal de eventos:', e)
  }
}
