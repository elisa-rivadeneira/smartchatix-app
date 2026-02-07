#!/usr/bin/env node

// 🔄 SCRIPT DE RECUPERACIÓN (si algo sale mal después del auto-deploy)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BackupRestore {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups/pre_deploy');
        this.productionHost = process.env.PRODUCTION_HOST || 'your-server.com';
        this.productionUser = process.env.PRODUCTION_USER || 'root';
        this.productionDB = process.env.PRODUCTION_DB_PATH || '/app/data/users.db';
    }

    listBackups() {
        if (!fs.existsSync(this.backupDir)) {
            console.log('❌ No hay backups disponibles');
            return [];
        }

        const manifests = fs.readdirSync(this.backupDir)
            .filter(f => f.startsWith('manifest_') && f.endsWith('.json'))
            .sort()
            .reverse();

        console.log('📋 BACKUPS DISPONIBLES:');
        console.log('==================================================');

        manifests.forEach((file, index) => {
            const manifestPath = path.join(this.backupDir, file);
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

            console.log(`${index + 1}. ${manifest.timestamp}`);
            console.log(`   📦 BD: ${path.basename(manifest.database_backup)}`);
            console.log(`   🏷️ Commit: ${manifest.git_commit.substring(0, 8)}`);
            console.log('');
        });

        return manifests;
    }

    async restoreLatest() {
        const manifests = this.listBackups();

        if (manifests.length === 0) {
            throw new Error('No hay backups disponibles');
        }

        const latestManifest = manifests[0];
        const manifestPath = path.join(this.backupDir, latestManifest);
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        console.log(`🔄 Restaurando backup: ${manifest.timestamp}`);

        await this.restoreDatabase(manifest.database_backup);

        console.log('✅ RESTAURACIÓN COMPLETADA');
        console.log('🔄 Reinicia tu aplicación en EasyPanel');
    }

    async restoreDatabase(dbBackupPath) {
        if (!fs.existsSync(dbBackupPath)) {
            throw new Error(`Backup no encontrado: ${dbBackupPath}`);
        }

        console.log('📦 Restaurando base de datos...');

        const scpCommand = `scp ${dbBackupPath} ${this.productionUser}@${this.productionHost}:${this.productionDB}`;
        console.log(`🔄 Ejecutando: ${scpCommand}`);

        execSync(scpCommand, { stdio: 'inherit' });

        console.log('✅ Base de datos restaurada');
    }

    async run() {
        const command = process.argv[2];

        console.log('🔄 RESTAURADOR DE BACKUPS');
        console.log('==================================================');

        switch (command) {
            case 'list':
                this.listBackups();
                break;
            case 'restore':
                await this.restoreLatest();
                break;
            default:
                console.log('Uso:');
                console.log('  node scripts/restore_backup.js list     - Ver backups');
                console.log('  node scripts/restore_backup.js restore  - Restaurar último');
                break;
        }
    }
}

// Ejecutar
const restore = new BackupRestore();
restore.run().catch(error => {
    console.error('💥 ERROR EN RESTAURACIÓN:', error.message);
    process.exit(1);
});