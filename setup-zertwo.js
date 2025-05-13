// Esta es la solución completa para el proyecto Zerotwo-MD

// 1. Crea un archivo llamado "setup-zerotwo.js" con el siguiente contenido:

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_URL = 'https://github.com/Korotito2/Zerotwo-MD.git';
const PROJECT_DIR = path.join(__dirname, 'Zerotwo-MD');

// Ejecutar comandos de forma asíncrona
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando: ${command}`);
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error en comando: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Clonar repositorio si no existe
async function setupRepository() {
  console.log('📥 Configurando repositorio...');
  
  try {
    await fs.access(PROJECT_DIR);
    console.log('✅ El directorio del proyecto ya existe. Limpiando...');
    // Limpiar directorio pero mantener node_modules para optimizar
    const files = await fs.readdir(PROJECT_DIR);
    for (const file of files) {
      if (file !== 'node_modules') {
        const filePath = path.join(PROJECT_DIR, file);
        await fs.rm(filePath, { recursive: true, force: true }).catch(() => {});
      }
    }
  } catch {
    console.log('🔄 Clonando repositorio por primera vez...');
    await execPromise(`git clone ${REPO_URL} ${PROJECT_DIR}`);
  }
  
  console.log('✅ Repositorio configurado correctamente');
}

// Corregir package.json
async function fixPackageJson() {
  console.log('🔧 Corrigiendo package.json...');
  
  const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
  
  try {
    // Verificar si existe package.json
    await fs.access(packageJsonPath);
    
    // Leer y modificar package.json
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Añadir "type": "module" si no existe
    let modified = false;
    if (!packageJson.type || packageJson.type !== 'module') {
      packageJson.type = 'module';
      modified = true;
      console.log('✅ Añadido "type": "module" a package.json');
    }
    
    // Actualizar scripts si es necesario
    if (!packageJson.scripts || !packageJson.scripts.start || !packageJson.scripts.start.includes('--experimental-specifier-resolution=node')) {
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.start = 'node --experimental-specifier-resolution=node index.js';
      modified = true;
      console.log('✅ Actualizado script de inicio con flags necesarios');
    }
    
    // Verificar engines
    if (!packageJson.engines || !packageJson.engines.node) {
      packageJson.engines = packageJson.engines || {};
      packageJson.engines.node = '>=18.15.0 || >=20.5.0';
      modified = true;
      console.log('✅ Añadidos requisitos de versión de Node.js');
    }
    
    // Guardar cambios si se modificó el archivo
    if (modified) {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log('✅ package.json actualizado y guardado');
    } else {
      console.log('ℹ️ package.json ya está configurado correctamente');
    }
  } catch (error) {
    console.error(`❌ Error al procesar package.json: ${error.message}`);
    
    // Si no existe, crear uno básico
    console.log('🔄 Creando package.json básico...');
    
    const basicPackageJson = {
      name: 'Zerotwo-MD',
      version: '1.0.0',
      description: 'Bot de WhatsApp basado en Baileys',
      main: 'index.js',
      type: 'module',
      scripts: {
        start: 'node --experimental-specifier-resolution=node index.js'
      },
      engines: {
        node: '>=18.15.0 || >=20.5.0'
      },
      dependencies: {
        '@whiskeysockets/baileys': '^6.5.0',
        'chalk': '^5.3.0',
        'express': '^4.18.2',
        'fs-extra': '^11.1.1',
        'qrcode-terminal': '^0.12.0',
        'write-file-atomic': '^6.0.0'
      }
    };
    
    await fs.writeFile(packageJsonPath, JSON.stringify(basicPackageJson, null, 2), 'utf8');
    console.log('✅ Creado package.json básico');
  }
}

// Instalar dependencias
async function installDependencies() {
  console.log('📦 Instalando dependencias...');
  
  try {
    await execPromise('npm install', { cwd: PROJECT_DIR });
    console.log('✅ Dependencias instaladas correctamente');
  } catch (error) {
    console.error(`❌ Error al instalar dependencias: ${error.message}`);
    throw error;
  }
}

// Corregir problemas de importación en archivos JavaScript
async function fixImportIssues() {
  console.log('🔍 Buscando problemas de importación en archivos...');
  
  async function findJsFiles(dir) {
    const files = await fs.readdir(dir);
    const jsFiles = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath).catch(() => null);
      
      if (!stats) continue;
      
      if (stats.isDirectory() && file !== 'node_modules') {
        const nestedFiles = await findJsFiles(filePath);
        jsFiles.push(...nestedFiles);
      } else if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs')) {
        jsFiles.push(filePath);
      }
    }
    
    return jsFiles;
  }
  
  // Analizar y corregir archivos
  async function analyzeAndFixFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Verificar si hay imports pero también requires (mezcla)
      const hasImport = content.includes('import ');
      const hasRequire = content.includes('require(');
      
      if (hasImport && hasRequire) {
        console.log(`⚠️ Archivo con mezcla de imports y requires: ${path.relative(PROJECT_DIR, filePath)}`);
      }
      
      // Verificar si hay errores comunes en importaciones
      const importWithoutExtension = /import .* from ['"]\.\/([^'"./]+)['"]/g;
      const hasImportWithoutExt = importWithoutExtension.test(content);
      
      if (hasImportWithoutExt) {
        console.log(`⚠️ Encontrada importación sin extensión en: ${path.relative(PROJECT_DIR, filePath)}`);
      }
    } catch (error) {
      console.error(`❌ Error al analizar archivo ${filePath}: ${error.message}`);
    }
  }
  
  try {
    const jsFiles = await findJsFiles(PROJECT_DIR);
    console.log(`🔍 Encontrados ${jsFiles.length} archivos JavaScript para analizar`);
    
    for (const file of jsFiles) {
      await analyzeAndFixFile(file);
    }
    
    console.log('✅ Análisis de archivos completado');
  } catch (error) {
    console.error(`❌ Error al buscar archivos: ${error.message}`);
  }
}

// Validar versión de Node.js
async function validateNodeVersion() {
  console.log('🔍 Verificando versión de Node.js...');
  
  const nodeVersionOutput = await execPromise('node --version');
  const version = nodeVersionOutput.trim().replace('v', '');
  const versionParts = version.split('.').map(Number);
  
  console.log(`ℹ️ Versión de Node.js detectada: ${version}`);
  
  if (
    (versionParts[0] === 18 && versionParts[1] >= 15) || 
    (versionParts[0] === 20 && versionParts[1] >= 5) ||
    (versionParts[0] > 20)
  ) {
    console.log('✅ Versión de Node.js compatible');
  } else {
    console.warn(`⚠️ ADVERTENCIA: La versión de Node.js (${version}) puede no ser compatible con este proyecto`);
    console.warn('💡 Se recomienda Node.js >=18.15.0 o >=20.5.0');
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando configuración de Zerotwo-MD...');
  
  try {
    await validateNodeVersion();
    await setupRepository();
    await fixPackageJson();
    await installDependencies();
    await fixImportIssues();
    
    console.log('\n✨ Configuración completada con éxito ✨');
    console.log('📝 Para iniciar el bot:');
    console.log(`   cd ${PROJECT_DIR}`);
    console.log('   npm start');
    
  } catch (error) {
    console.error(`\n❌ Error durante la configuración: ${error.message}`);
    console.error('Por favor, revisa los mensajes anteriores para más detalles.');
  }
}

// Ejecutar el script
main().catch(console.error);
