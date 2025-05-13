import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tmp = path.join(__dirname, '../tmp')

// Crear directorio temporal si no existe
if (!fs.existsSync(tmp)) {
  fs.mkdirSync(tmp, { recursive: true })
}

export default function stickerHandler() {
  const info = {
    command: ['sticker', 's', 'stiker'],
    handler: async ({ m, text, sock, args }) => {
      let stiker = false
      
      try {
        // Verificar si hay una imagen o video adjunto
        let mime = m.quoted ? m.quoted.mimetype || '' : m.mimetype || ''
        if (/webp/.test(mime)) {
          // Si ya es un sticker, mostrar mensaje de error
          return sock.sendMessage(m.key.remoteJid, { text: '❌ Ya es un sticker, usa el comando /toimg para convertirlo a imagen.' }, { quoted: m })
        }
        
        // Solo permitir imagen o video
        if (!/image|video/.test(mime)) {
          return sock.sendMessage(m.key.remoteJid, { 
            text: '❌ Envía o responde a una imagen o video con el comando /sticker' 
          }, { quoted: m })
        }
        
        // Enviar mensaje de procesamiento
        await sock.sendMessage(m.key.remoteJid, { text: global.stiker_wait }, { quoted: m })
        
        // Obtener buffer de datos (imagen o video)
        let media = m.quoted ? await m.quoted.download() : await m.download()
        
        // Crear ruta temporal para el archivo
        const randomName = `${Math.floor(Math.random() * 10000)}.webp`
        const outputPath = path.join(tmp, randomName)
        
        // Crear sticker con wa-sticker-formatter
        const stickerOptions = {
          pack: global.packname,
          author: global.author,
          quality: 50,
          type: 'full',
          categories: ['🤩', '🎉'],
          id: '12345',
          background: 'transparent'
        }
        
        const stickerMetadata = {
          ...stickerOptions,
          pack: args.join(" ") || global.packname,
          author: global.author
        }
        
        // Crear el sticker
        const sticker = new Sticker(media, stickerMetadata)
        const stickerBuffer = await sticker.toBuffer()
        
        // Guardar y enviar el sticker
        fs.writeFileSync(outputPath, stickerBuffer)
        await sock.sendMessage(m.key.remoteJid, { 
          sticker: { url: outputPath } 
        }, { quoted: m })
        
        // Eliminar archivo temporal
        setTimeout(() => {
          try {
            fs.unlinkSync(outputPath)
          } catch (e) {
            console.log('Error al eliminar archivo temporal:', e)
          }
        }, 5000)
      } catch (e) {
        console.error('Error al crear sticker:', e)
        sock.sendMessage(m.key.remoteJid, { 
          text: '❌ Error al crear el sticker. Inténtalo de nuevo.' 
        }, { quoted: m })
      }
    }
  }
  
  return info
}
