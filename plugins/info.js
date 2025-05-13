import os from 'os'
import speed from 'performance-now'

export default function info() {
  const info = {
    command: ['info', 'infobot', 'botinfo'],
    handler: async ({ m, sock }) => {
      // Tiempo de inicio y finalización para calcular la velocidad
      const timestamp = speed()
      const latensi = speed() - timestamp
      
      // Información del sistema
      const totalRAM = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100
      const freeRAM = Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100
      const usedRAM = (totalRAM - freeRAM).toFixed(2)
      
      const uptime = process.uptime()
      const uptimeHours = Math.floor(uptime / 3600)
      const uptimeMinutes = Math.floor((uptime % 3600) / 60)
      const uptimeSeconds = Math.floor(uptime % 60)
      
      // Texto de información
      const infoText = `
╭───────────────────╮
│ *ZEROTWO-MD INFO*
╰───────────────────╯

*Bot Name:* Zerotwo-MD
*Version:* 1.0.0
*Author:* Ziz
*Library:* Baileys MD
*Language:* JavaScript
*Runtime:* Node.js

*System Info:*
- *Platform:* ${os.platform()}
- *Arch:* ${os.arch()}
- *RAM:* ${usedRAM}GB / ${totalRAM}GB
- *CPU:* ${os.cpus()[0].model}

*Bot Stats:*
- *Speed:* ${latensi.toFixed(4)} ms
- *Uptime:* ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s

*GitHub Repository:*
https://github.com/Korotito2/Zerotwo-MD

*© Zerotwo-MD by Ziz*
`

      await sock.sendMessage(m.key.remoteJid, {
        text: infoText
      }, { quoted: m })
    }
  }
  
  return info
}
