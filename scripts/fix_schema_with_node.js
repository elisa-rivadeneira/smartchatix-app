#!/usr/bin/env node

// 🔧 ARREGLAR ESQUEMA DE BASE DE DATOS CON NODE.JS
// Para cuando sqlite3 command no está disponible

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔧 ARREGLANDO ESQUEMA DE BASE DE DATOS CON NODE.JS');
console.log('==================================================');

const dbPath = path.join(__dirname, '../data/users.db');

// 1. Verificar que la DB existe
if (!fs.existsSync(dbPath)) {
    console.log('❌ CRÍTICO: Base de datos no encontrada en:', dbPath);
    process.exit(1);
}

console.log('✅ Base de datos encontrada:', dbPath);

// 2. Crear backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '');
const backupPath = path.join(__dirname, `../data/users_node_schema_fix_${timestamp}.db`);

try {
    fs.copyFileSync(dbPath, backupPath);
    console.log('💾 Backup creado:', backupPath);
} catch (error) {
    console.log('⚠️ Error creando backup:', error.message);
}

// 3. Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a la base de datos SQLite');
});

// 4. Función para agregar columna si no existe
function addColumnIfNotExists(tableName, columnName, columnType = 'INTEGER DEFAULT 0') {
    return new Promise((resolve, reject) => {
        // Primero verificar si la tabla existe
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tableName], (err, row) => {
            if (err) {
                console.log(`⚠️ Error verificando tabla ${tableName}:`, err.message);
                resolve();
                return;
            }

            if (!row) {
                console.log(`⚠️ Tabla ${tableName} no existe, saltando...`);
                resolve();
                return;
            }

            // Verificar si la columna ya existe
            db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                if (err) {
                    console.log(`⚠️ Error obteniendo info de ${tableName}:`, err.message);
                    resolve();
                    return;
                }

                const hasColumn = columns.some(col => col.name === columnName);

                if (hasColumn) {
                    console.log(`✅ Tabla ${tableName} ya tiene columna '${columnName}'`);
                    resolve();
                    return;
                }

                // Agregar la columna
                const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
                db.run(sql, (err) => {
                    if (err) {
                        console.log(`❌ Error agregando columna ${columnName} a ${tableName}:`, err.message);
                    } else {
                        console.log(`✅ Columna '${columnName}' agregada a tabla ${tableName}`);
                    }
                    resolve();
                });
            });
        });
    });
}

// 5. Agregar columnas necesarias
async function fixSchema() {
    console.log('\n🔧 Agregando columnas faltantes...');

    try {
        await addColumnIfNotExists('tasks', 'archived');
        await addColumnIfNotExists('daily_tasks', 'archived');
        await addColumnIfNotExists('project_tasks', 'archived');

        console.log('\n📊 Verificando esquema final...');

        // Verificar esquemas finales
        const tables = ['tasks', 'daily_tasks', 'project_tasks'];

        for (const table of tables) {
            await new Promise((resolve) => {
                db.all(`PRAGMA table_info(${table})`, (err, columns) => {
                    if (err || !columns) {
                        console.log(`⚠️ Tabla ${table}: no existe o error`);
                    } else {
                        const hasArchived = columns.some(col => col.name === 'archived');
                        console.log(`📋 Tabla ${table}: columna 'archived' ${hasArchived ? '✅ PRESENTE' : '❌ FALTA'}`);
                    }
                    resolve();
                });
            });
        }

    } catch (error) {
        console.error('❌ Error en arreglo de esquema:', error);
    }

    // 6. Cerrar conexión
    db.close((err) => {
        if (err) {
            console.error('Error cerrando DB:', err.message);
        } else {
            console.log('\n✅ Base de datos cerrada correctamente');
        }

        console.log('\n🎉 ARREGLO DE ESQUEMA COMPLETADO');
        console.log('==================================================');
        console.log('📋 PRÓXIMOS PASOS:');
        console.log('1. Reinicia la aplicación: pkill -f node && node server.js &');
        console.log('2. Prueba crear una tarea en https://app.smartchatix.com');
        console.log('3. El error 500 debería estar resuelto');

        process.exit(0);
    });
}

fixSchema();