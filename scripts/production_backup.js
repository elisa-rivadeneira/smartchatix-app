#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionBackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups/production');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.remoteHost = process.env.PRODUCTION_HOST || 'localhost';
        this.remoteUser = process.env.PRODUCTION_USER || 'root';
        this.remotePath = process.env.PRODUCTION_PATH || path.join(__dirname, '..');
        this.dbPath = process.env.PRODUCTION_DB_PATH || path.join(__dirname, '../data/users.db');
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ Directorio de backups creado: ${this.backupDir}`);
        }
    }

    async backupProductionDatabase() {
        try {
            console.log('🔄 Iniciando backup de base de datos de producción...');

            const backupFileName = `production_db_${this.timestamp}.db`;
            const localBackupPath = path.join(this.backupDir, backupFileName);

            // Si estamos en localhost, usar cp en lugar de scp
            if (this.remoteHost === 'localhost' || this.remoteHost === '127.0.0.1') {
                console.log(`📁 Copiando localmente: ${this.dbPath} → ${localBackupPath}`);
                if (fs.existsSync(this.dbPath)) {
                    fs.copyFileSync(this.dbPath, localBackupPath);
                    console.log(`✅ Backup local guardado: ${localBackupPath}`);
                } else {
                    throw new Error(`Base de datos no encontrada: ${this.dbPath}`);
                }
            } else {
                // Usar SCP para servidores remotos
                const scpCommand = `scp ${this.remoteUser}@${this.remoteHost}:${this.dbPath} ${localBackupPath}`;
                console.log(`📥 Descargando: ${scpCommand}`);
                execSync(scpCommand, { stdio: 'inherit' });
                console.log(`✅ Backup remoto guardado: ${localBackupPath}`);
            }

            return localBackupPath;
        } catch (error) {
            console.error('❌ Error en backup de producción:', error.message);
            throw error;
        }
    }

    async backupProductionFiles() {
        try {
            console.log('🔄 Iniciando backup de archivos de producción...');

            const backupFileName = `production_files_${this.timestamp}.tar.gz`;
            const localBackupPath = path.join(this.backupDir, backupFileName);

            // Si estamos en localhost, crear tar local
            if (this.remoteHost === 'localhost' || this.remoteHost === '127.0.0.1') {
                console.log(`📦 Creando archivo local en: ${localBackupPath}`);
                const tarCommand = `tar -czf ${localBackupPath} -C ${this.remotePath} --exclude=node_modules --exclude=.git --exclude=backups .`;
                console.log(`🔄 Ejecutando: ${tarCommand}`);
                execSync(tarCommand, { stdio: 'inherit' });
            } else {
                // Crear tar remoto y descargar
                const remoteCommand = `ssh ${this.remoteUser}@${this.remoteHost} "cd ${this.remotePath} && tar -czf /tmp/${backupFileName} --exclude=node_modules --exclude=.git ."`;
                const downloadCommand = `scp ${this.remoteUser}@${this.remoteHost}:/tmp/${backupFileName} ${localBackupPath}`;
                const cleanupCommand = `ssh ${this.remoteUser}@${this.remoteHost} "rm /tmp/${backupFileName}"`;

                console.log('📦 Creando archivo remoto...');
                execSync(remoteCommand, { stdio: 'inherit' });

                console.log('📥 Descargando archivo...');
                execSync(downloadCommand, { stdio: 'inherit' });

                console.log('🧹 Limpiando archivos temporales...');
                execSync(cleanupCommand, { stdio: 'inherit' });
            }

            console.log(`✅ Backup de archivos guardado: ${localBackupPath}`);
            return localBackupPath;
        } catch (error) {
            console.error('❌ Error en backup de archivos:', error.message);
            throw error;
        }
    }

    async createFullProductionBackup() {
        try {
            console.log('🚀 INICIANDO BACKUP COMPLETO DE PRODUCCIÓN');
            console.log('=' .repeat(50));

            this.ensureBackupDirectory();

            const dbBackupPath = await this.backupProductionDatabase();
            const filesBackupPath = await this.backupProductionFiles();

            // Crear manifest del backup
            const manifest = {
                timestamp: new Date().toISOString(),
                database_backup: dbBackupPath,
                files_backup: filesBackupPath,
                production_host: this.remoteHost,
                backup_type: 'pre_deployment'
            };

            const manifestPath = path.join(this.backupDir, `manifest_${this.timestamp}.json`);
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

            console.log('=' .repeat(50));
            console.log('✅ BACKUP COMPLETO FINALIZADO');
            console.log(`📋 Manifest: ${manifestPath}`);
            console.log(`💾 Base de datos: ${dbBackupPath}`);
            console.log(`📁 Archivos: ${filesBackupPath}`);

            return manifest;
        } catch (error) {
            console.error('💥 FALLO CRÍTICO EN BACKUP:', error.message);
            process.exit(1);
        }
    }

    async listBackups() {
        console.log('📋 Backups disponibles:');
        if (!fs.existsSync(this.backupDir)) {
            console.log('❌ No hay backups disponibles');
            return;
        }

        const files = fs.readdirSync(this.backupDir)
            .filter(file => file.endsWith('.json'))
            .sort()
            .reverse();

        files.forEach((file, index) => {
            const manifestPath = path.join(this.backupDir, file);
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            console.log(`${index + 1}. ${manifest.timestamp}`);
            console.log(`   📊 DB: ${path.basename(manifest.database_backup)}`);
            console.log(`   📁 Files: ${path.basename(manifest.files_backup)}`);
        });
    }
}

// CLI Interface
const command = process.argv[2];
const backup = new ProductionBackupManager();

switch (command) {
    case 'create':
        backup.createFullProductionBackup();
        break;
    case 'list':
        backup.listBackups();
        break;
    default:
        console.log('💾 Production Backup Manager');
        console.log('Uso:');
        console.log('  node production_backup.js create  - Crear backup completo');
        console.log('  node production_backup.js list    - Listar backups');
        break;
}