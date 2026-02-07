#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class LocalBackupManager {
    constructor() {
        this.backupDir = '/app/backups/production';
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.dbPath = '/app/data/users.db';
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ Directorio de backups creado: ${this.backupDir}`);
        }
    }

    async backupLocalDatabase() {
        try {
            console.log('🔄 Iniciando backup de base de datos local...');

            const backupFileName = `local_db_${this.timestamp}.db`;
            const backupPath = path.join(this.backupDir, backupFileName);

            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, backupPath);
                console.log(`✅ Backup local guardado: ${backupPath}`);
                return backupPath;
            } else {
                console.log(`⚠️ Base de datos no encontrada en: ${this.dbPath}`);
                return null;
            }
        } catch (error) {
            console.error('❌ Error en backup local:', error.message);
            throw error;
        }
    }

    async createBackup() {
        console.log('🚀 INICIANDO BACKUP LOCAL');
        console.log('==================================================');

        this.ensureBackupDirectory();
        const dbBackup = await this.backupLocalDatabase();

        console.log('==================================================');
        console.log('✅ BACKUP LOCAL COMPLETADO');

        return {
            database: dbBackup,
            timestamp: this.timestamp
        };
    }

    listBackups() {
        console.log('📋 BACKUPS DISPONIBLES:');
        console.log('==================================================');

        if (!fs.existsSync(this.backupDir)) {
            console.log('❌ No hay directorio de backups');
            return;
        }

        const files = fs.readdirSync(this.backupDir);
        const backups = files.filter(f => f.endsWith('.db') || f.endsWith('.tar.gz'));

        if (backups.length === 0) {
            console.log('❌ No hay backups disponibles');
            return;
        }

        backups.sort().reverse().forEach(backup => {
            const filePath = path.join(this.backupDir, backup);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2);
            console.log(`📁 ${backup} (${size} KB) - ${stats.mtime.toISOString()}`);
        });
    }
}

// Ejecutar según el comando
const command = process.argv[2] || 'create';
const backup = new LocalBackupManager();

switch (command) {
    case 'create':
        backup.createBackup().catch(error => {
            console.error('💥 FALLO CRÍTICO EN BACKUP:', error.message);
            process.exit(1);
        });
        break;
    case 'list':
        backup.listBackups();
        break;
    default:
        console.log('Uso: node local_backup.js [create|list]');
        process.exit(1);
}