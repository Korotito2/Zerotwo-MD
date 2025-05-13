import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createCanvas, loadImage } from 'canvas'
import * as webp from 'webp-converter'

// Habilitar el convertidor de webp
webp.grant_permission()

const __dirname = dirname(fileURLToPath(import.meta.url))
const tmp = path.join(__dirname, '../tmp')

// Crear directorio temporal si no existe
if (!fs.existsSync(tmp)) {
  fs.mkdirSync(tmp, { recursive: true })
}

export default function toImage() {
  const info = {
    command: ['toimg', 'toimage'],
    handler: async ({ m, sock }) => {
      try {
        // Verificar si es respuesta a un sticker
        if (!m.quoted) {
          return sock.sendMessage(m.key.remoteJid, { 
            text: '❌ Responde a un sticker con este comando para convertirlo en imagen.' 
          }, { quoted: m })
        }
        
        // Verificar si es un sticker
        let mime = m.quoted.mimetype || ''
        if (!/webp/.test(mime)) {
          return sock.sendMessage(m.key.remoteJid, { 
            text: '❌ Responde a un sticker con este comando para convertirlo en imagen.' 
          }, { quoted: m })
        }
        
        // Enviar mensaje de procesamiento
        await sock.sendMessage(m.key.remoteJid, { text: '⌛ Convirtiendo sticker a imagen...' }, { quoted: m })
        
        // Obtener buffer del sticker
        let media = await m.quoted.download()
        
        // Crear archivos temporales
        const webpPath = path.join(tmp, `${Math.floor(Math.random() * 10000)}.webp`)
        const pngPath = path.join(tmp, `${Math.floor(Math.random() * 10000)}.png`)
        
        // Guardar sticker como archivo temporal
        fs.writeFileSync(webpPath, media)
        
        // Convertir webp a png
        await webp.dwebp(webpPath, pngPath, "-o")
        
        // Enviar la imagen resultante
        await sock.sendMessage(m.key.remoteJid, { 
          image: { url: pngPath },
          caption: '✅ Sticker convertido a imagen exitosamente.' 
        }, { quoted: m })
        
        // Eliminar archivos temporales
        setTimeout(() => {
          try {
            fs.unlinkSync(webpPath)
            fs.unlinkSync(pngPath)
          } catch (e) {
            console.log('Error al eliminar archivos temporales:', e)
          }
        }, 5000)
      } catch (e) {
        console.error('Error al convertir sticker a imagen:', e)
        sock.sendMessage(m.key.remoteJid, { 
          text: '❌ Error al convertir el sticker a imagen. Inténtalo de nuevo.' 
        }, { quoted: m })
      }
    }
  }
  
  return info
}
