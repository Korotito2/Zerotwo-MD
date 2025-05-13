import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import moment from 'moment-timezone'

//Información del Owner/Propietario
global.owner = [
  ['TU_NUMERO_AQUI', 'Ziz', true]
]
global.suittag = ['TU_NUMERO_AQUI']
global.mods = []
global.prems = []

//Información del Bot
global.packname = 'Zerotwo-MD'
global.author = 'Ziz'
global.wm = 'Zerotwo-Bot'
global.vs = '1.0'
global.igfg = 'Sígueme en Instagram\nhttps://www.instagram.com/tu_instagram'
global.namebot = 'Zerotwo-MD'
global.wait = '*⌛ _Cargando..._ ▬▬▬▭*'
global.gcname = 'Zerotwo-MD'

//Stickers
global.stiker_wait = '*⌛ _Creando sticker..._ ▬▬▬▭*'
global.packname = 'Zerotwo-MD'
global.author = 'Ziz'

//APIs
global.APIs = {
  xteam: 'https://api.xteam.xyz',
  nrtm: 'https://fg-nrtm.ddns.net',
  bg: 'http://bochil.ddns.net',
  fgmods: 'https://api-fgmods.ddns.net'
}
global.APIKeys = {
  'https://api.xteam.xyz': 'd90a9e986e18778b',
  'https://fg-nrtm.ddns.net': 'APIKEY',
  'https://api-fgmods.ddns.net': 'APIKEY'
}

// Imágenes
global.imagen1 = fs.readFileSync('./media/menu.jpg')
global.imagen2 = fs.readFileSync('./media/menu2.jpg')
global.imagen3 = fs.readFileSync('./media/menu3.png')
global.imagen4 = fs.readFileSync('./media/menu4.jpg')
global.imagen5 = fs.readFileSync('./media/menu5.jpg')
global.imagen6 = fs.readFileSync('./media/menu6.jpg')

// Otros
global.multiplier = 69
global.maxwarn = '3' // máxima advertencias

// Tiempo
let d = new Date(new Date + 3600000)
let locale = 'es'
let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
let week = d.toLocaleDateString(locale, { weekday: 'long' })
let date = d.toLocaleDateString(locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})
let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(d)
let time = d.toLocaleTimeString(locale, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
})
let _uptime = process.uptime() * 1000
let _muptime
if (process.send) {
  process.send('uptime')
  _muptime = await new Promise(resolve => {
    process.once('message', resolve)
    setTimeout(resolve, 1000)
  }) * 1000
}
let muptime = clockString(_muptime)
let uptime = clockString(_uptime)

// Función para formatear tiempo
function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

// Observador de archivos
watchFile(fileURLToPath(import.meta.url), () => {
  unwatchFile(fileURLToPath(import.meta.url))
  console.log(chalk.cyan('\n[' + filename + '] Actualizado con éxito!\n'))
  import(`${fileURLToPath(import.meta.url)}?update=${Date.now()}`)
})
