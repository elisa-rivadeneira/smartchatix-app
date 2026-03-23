#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando volumen persistente...');

// Verificar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';
const dataPath = isProduction ? '/data' : path.join(__dirname, '../data');
const dbPath = path.join(dataPath, 'users.db');

console.log(`🌍 Entorno: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
console.log(`📁 Directorio de datos: ${dataPath}`);
console.log(`💾 Ruta de BD: ${dbPath}`);

// Crear directorio si no existe
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
  console.log(`✅ Directorio creado: ${dataPath}`);
} else {
  console.log(`✅ Directorio ya existe: ${dataPath}`);
}

// Crear archivo de marca para verificar persistencia
const markerPath = path.join(dataPath, 'volume_test.txt');
const timestamp = new Date().toISOString();

fs.writeFileSync(markerPath, `Volumen verificado: ${timestamp}\nDeploy: ${process.env.BUILD_ID || 'local'}\n`);
console.log(`📝 Archivo de marca creado: ${markerPath}`);

// Verificar si existe la BD
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log(`✅ Base de datos encontrada: ${dbPath}`);
  console.log(`📊 Tamaño: ${stats.size} bytes`);
  console.log(`📅 Modificado: ${stats.mtime}`);
} else {
  console.log(`❌ Base de datos NO encontrada: ${dbPath}`);
  console.log('🔧 Se creará automáticamente al iniciar la aplicación');
}

// Listar contenido del directorio
console.log('\n📋 Contenido del directorio de datos:');
try {
  const files = fs.readdirSync(dataPath);
  if (files.length === 0) {
    console.log('   (vacío)');
  } else {
    files.forEach(file => {
      const filePath = path.join(dataPath, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
    });
  }
} catch (error) {
  console.error(`❌ Error listando directorio: ${error.message}`);
}

console.log('\n✅ Verificación de volumen completada');