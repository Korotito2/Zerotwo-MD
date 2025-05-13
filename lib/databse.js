import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Crear directorio de datos si no existe
const __dirname = dirname(fileURLToPath(import.meta.url))
const databaseFolder = join(__dirname, '../database')
if (!fs.existsSync(databaseFolder)) {
  fs.mkdirSync(databaseFolder, { recursive: true })
}

const dbFile = join(databaseFolder, 'database.json')

// Estructura inicial de la base de datos
const initial = {
  users: {},
  groups: {},
  stats: {},
  settings: {},
  ...(fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {})
}

// Configuración de lowdb
const adapter = new JSONFile(dbFile)
const db = new Low(adapter)

// Cargar datos iniciales
db.data = initial
await db.write()

// Función para cargar la base de datos
export function load() {
  if (db.data) return db.data
  db.read()
  db.data ||= initial
  db.chain = _.chain(db.data)
  return db.data
}

// Función para guardar la base de datos
export async function save() {
  await db.write()
  return db.data
}

// Exportación por defecto
export default { load, save }
