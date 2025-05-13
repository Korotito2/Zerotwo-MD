import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginsFolder = path.join(__dirname, '../plugins')

export default async function commandHandler(chatUpdate) {
  try {
    const m = chatUpdate.messages[0]
    if (!m) return
    if (m.key && m.key.remoteJid === 'status@broadcast') return
    
    const body = (m.message?.conversation) ? m.message.conversation :
      (m.message?.imageMessage?.caption) ? m.message.imageMessage.caption :
      (m.message?.videoMessage?.caption) ? m.message.videoMessage.caption :
      (m.message?.extendedTextMessage?.text) ? m.message.extendedTextMessage.text :
      (m.message?.buttonsResponseMessage?.selectedButtonId) ? m.message.buttonsResponseMessage.selectedButtonId :
      (m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) ? m.message.listResponseMessage.singleSelectReply.selectedRowId : ''
    
    const prefix = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/gi) : '/'
    
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const text = args.join(' ')
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    const sender = m.key.fromMe ? (this.user.id.split(':')[0]+'@s.whatsapp.net' || this.user.id) : (m.key.participant || m.key.remoteJid)
    const senderNumber = sender.split('@')[0]
    const botNumber = this.user.id.split(':')[0]
    const pushname = m.pushName || 'Sin Nombre'
    
    const isOwner = global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender) || false
    const groupMetadata = isGroup ? await this.groupMetadata(m.key.remoteJid) : {}
    const groupName = isGroup ? groupMetadata.subject : ''
    const participants = isGroup ? await groupMetadata.participants : []
    const groupAdmins = isGroup ? participants.filter(v => v.admin !== null).map(v => v.id) : []
    const isBotAdmin = isGroup ? groupAdmins.includes(this.user.id.split(':')[0] + '@s.whatsapp.net') : false
    const isGroupAdmin = isGroup ? groupAdmins.includes(sender) : false
    
    // Formato de mensaje fácil de usar para enviar respuestas
    const reply = (text) => {
      this.sendMessage(m.key.remoteJid, { text: text }, { quoted: m })
    }
    
    // Log de comando recibido
    if (isCmd) {
      console.log(`📩 Comando recibido: ${command} | De: ${pushname} | Grupo: ${isGroup ? groupName : 'Chat Privado'}`)
    }
    
    // Procesar comandos usando plugins
    try {
      const pluginFiles = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'))
      
      for (let file of pluginFiles) {
        const pluginPath = path.join(pluginsFolder, file)
        const plugin = await import(`file://${pluginPath}`)
        
        if (plugin.default && typeof plugin.default === 'function') {
          const pluginInfo = plugin.default({
            command,
            prefix,
            text,
            args,
            isGroup,
            sender,
            pushname,
            m,
            body,
            isOwner,
            isGroupAdmin,
            isBotAdmin,
            groupName,
            groupMetadata,
            sock: this
          })
          
          if (pluginInfo && pluginInfo.command && (pluginInfo.command === command || 
              (Array.isArray(pluginInfo.command) && pluginInfo.command.includes(command)))) {
            if (pluginInfo.handler && typeof pluginInfo.handler === 'function') {
              await pluginInfo.handler({
                command,
                prefix,
                text,
                args,
                isGroup,
                sender,
                pushname,
                m,
                body,
                reply,
                isOwner,
                isGroupAdmin,
                isBotAdmin,
                groupName,
                groupMetadata,
                sock: this
              })
              
              // Comando procesado, salir del bucle
              break
            }
          }
        }
      }
    } catch (e) {
      console.error('Error al procesar el comando:', e)
    }
  } catch (e) {
    console.error('Error en el manejador de comandos:', e)
  }
}
