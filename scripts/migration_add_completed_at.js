#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/users.db');

console.log('🔄 Ejecutando migración: Agregar columna completed_at...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
    process.exit(1);
  }
});

// Verificar si la columna ya existe
db.all("PRAGMA table_info(daily_tasks)", (err, columns) => {
  if (err) {
    console.error('❌ Error obteniendo información de la tabla:', err);
    process.exit(1);
  }

  const hasCompletedAt = columns.some(col => col.name === 'completed_at');

  if (hasCompletedAt) {
    console.log('✅ La columna completed_at ya existe, no es necesaria la migración');
    db.close();
    process.exit(0);
  }

  // Agregar la columna
  db.run("ALTER TABLE daily_tasks ADD COLUMN completed_at DATETIME DEFAULT NULL;", (err) => {
    if (err) {
      console.error('❌ Error agregando columna completed_at:', err);
      process.exit(1);
    }

    console.log('✅ Migración completada: columna completed_at agregada a daily_tasks');

    db.close((err) => {
      if (err) {
        console.error('❌ Error cerrando base de datos:', err);
        process.exit(1);
      }
      console.log('📋 Migración finalizada exitosamente');
      process.exit(0);
    });
  });
});