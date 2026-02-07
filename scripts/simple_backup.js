#!/usr/bin/env node

// 🔒 BACKUP SIMPLE (todo en el mismo servidor)

const fs = require('fs');
const path = require('path');

class SimpleBackup {
    constructor() {
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.backupDir = '/app/backups/pre_deploy';
        this.dbPath = '/app/data/users.db';
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ Directorio creado: ${this.backupDir}`);
        }
    }

    async backupDB() {
        if (!fs.existsSync(this.dbPath)) {
            throw new Error(`BD no encontrada: ${this.dbPath}`);
        }

        const backupFile = `backup_${this.timestamp}.db`;
        const backupPath = path.join(this.backupDir, backupFile);

        fs.copyFileSync(this.dbPath, backupPath);

        console.log(`✅ BD respaldada: ${backupPath}`);
        return backupPath;
    }

    createManifest(dbPath) {
        const manifest = {
            timestamp: new Date().toISOString(),
            backup_type: 'pre_deploy',
            database_backup: dbPath,
            restore_command: `cp ${dbPath} ${this.dbPath}`
        };

        const manifestPath = path.join(this.backupDir, `manifest_${this.timestamp}.json`);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        console.log(`📋 Manifest: ${manifestPath}`);
        return manifest;
    }

    async run() {
        console.log('🛡️ BACKUP SIMPLE');
        console.log('==================================================');

        this.ensureBackupDirectory();
        const dbBackup = await this.backupDB();
        this.createManifest(dbBackup);

        console.log('==================================================');
        console.log('✅ BACKUP COMPLETADO');
        console.log('🔄 Para restaurar: node scripts/simple_restore.js');
    }
}

// Ejecutar
const backup = new SimpleBackup();
backup.run().catch(error => {
    console.error('💥 ERROR:', error.message);
    process.exit(1);
});