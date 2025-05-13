export default function menu() {
  const info = {
    command: ['menu', 'help', 'comandos'],
    handler: async ({ m, pushname, sock }) => {
      const user = `@${m.sender.split('@')[0]}`
      
      // Obtener fecha y hora actual
      const fecha = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
      
      const hora = new Date().toLocaleTimeString('es-ES', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      })
      
      // Header
      let menuText = `
╭───────────────────╮
│ *ZEROTWO-MD*
│ *Fecha:* ${fecha}
│ *Hora:* ${hora}
│ *Usuario:* ${user}
╰───────────────────╯

*< LISTA DE COMANDOS >*

`
      
      // Menú Principal
      menuText += `
╭────────────────────
│ *INFORMACIÓN*
│ > /menu
│ > /info
│ > /ping
│ > /owner
│ > /script
╰────────────────────

╭────────────────────
│ *STICKERS*
│ > /sticker (img/vid)
│ > /toimg (sticker)
│ > /attp (texto)
│ > /emojimix (emoji+emoji)
╰────────────────────

╭────────────────────
│ *DESCARGAS*
│ > /play (búsqueda)
│ > /ytmp3 (enlace)
│ > /ytmp4 (enlace)
│ > /tiktok (enlace)
│ > /instagram (enlace)
╰────────────────────

╭────────────────────
│ *GRUPOS*
│ > /add (número)
│ > /kick (@usuario)
│ > /promote (@usuario)
│ > /demote (@usuario)
│ > /link
│ > /grupo (abrir/cerrar)
│ > /tagall (mensaje)
╰────────────────────

╭────────────────────
│ *JUEGOS*
│ > /ttt (tic-tac-toe)
│ > /dado
│ > /verdad
│ > /reto
│ > /ppt (piedra/papel/tijera)
╰────────────────────

╭────────────────────
│ *HERRAMIENTAS*
│ > /translate (texto)
│ > /ocr (imagen)
│ > /chatgpt (pregunta)
│ > /clima (ciudad)
╰────────────────────

*Zerotwo-MD por Ziz*
*https://github.com/Korotito2/Zerotwo-MD*
`

      await sock.sendMessage(m.key.remoteJid, {
        text: menuText,
        mentions: [m.sender]
      }, { quoted: m })
    }
  }
  
  return info
}
