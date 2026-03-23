#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Inicializando sistema de base de datos...');

// Rutas posibles donde puede estar la BD
const possibleDbPaths = [
  './users.db',
  './data/users.db',
  './src/database/users.db',
  '/app/users.db',
  '/tmp/users.db'
];

const targetDbPath = path.join(__dirname, '../data/users.db');

// Asegurar que el directorio /data existe
const dataDir = path.dirname(targetDbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Directorio creado: ${dataDir}`);
}

// Buscar BD existente y moverla al volumen persistente
let foundExistingDb = false;

for (const dbPath of possibleDbPaths) {
  const fullPath = path.resolve(dbPath);

  if (fs.existsSync(fullPath) && fullPath !== path.resolve(targetDbPath)) {
    console.log(`🔍 BD encontrada en: ${fullPath}`);

    try {
      // Copiar la BD existente al volumen persistente
      fs.copyFileSync(fullPath, targetDbPath);
      console.log(`✅ BD movida a volumen persistente: ${targetDbPath}`);

      // Eliminar la BD original
      fs.unlinkSync(fullPath);
      console.log(`🗑️ BD original eliminada: ${fullPath}`);

      foundExistingDb = true;
      break;
    } catch (error) {
      console.error(`❌ Error moviendo BD: ${error.message}`);
    }
  }
}

if (!foundExistingDb) {
  if (fs.existsSync(targetDbPath)) {
    console.log(`✅ BD ya existe en volumen persistente: ${targetDbPath}`);
  } else {
    console.log(`📝 No se encontró BD existente, se creará nueva en: ${targetDbPath}`);
  }
}

console.log('✅ Inicialización de BD completada');