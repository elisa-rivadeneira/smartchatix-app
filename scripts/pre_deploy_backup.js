#!/usr/bin/env node

// 🔒 BACKUP REMOTO ANTES DE PUSH (para EasyPanel auto-deploy)
// Ejecutar ANTES de hacer git push

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PreDeployBackup {
    constructor() {
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.backupDir = path.join(__dirname, '../backups/pre_deploy');

        // Configuración de producción desde .env
        this.productionHost = process.env.PRODUCTION_HOST || 'your-server.com';
        this.productionUser = process.env.PRODUCTION_USER || 'root';
        this.productionPath = process.env.PRODUCTION_PATH || '/app';
        this.productionDB = process.env.PRODUCTION_DB_PATH || '/app/data/users.db';
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ Directorio creado: ${this.backupDir}`);
        }
    }

    async backupProductionDB() {
        try {
            console.log('📦 Haciendo backup de BD de producción...');

            const backupFile = `production_db_${this.timestamp}.db`;
            const localPath = path.join(this.backupDir, backupFile);

            const scpCommand = `scp ${this.productionUser}@${this.productionHost}:${this.productionDB} ${localPath}`;
            console.log(`🔄 Ejecutando: ${scpCommand}`);

            execSync(scpCommand, { stdio: 'inherit' });

            console.log(`✅ BD respaldada: ${localPath}`);
            return localPath;
        } catch (error) {
            console.error('❌ Error en backup de BD:', error.message);
            throw error;
        }
    }

    async createManifest(dbPath) {
        const manifest = {
            timestamp: new Date().toISOString(),
            backup_type: 'pre_deploy',
            production_host: this.productionHost,
            database_backup: dbPath,
            git_commit: this.getGitCommit(),
            instructions: {
                restore_db: `scp ${dbPath} ${this.productionUser}@${this.productionHost}:${this.productionDB}`
            }
        };

        const manifestPath = path.join(this.backupDir, `manifest_${this.timestamp}.json`);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        console.log(`📋 Manifest creado: ${manifestPath}`);
        return manifest;
    }

    getGitCommit() {
        try {
            return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch {
            return 'unknown';
        }
    }

    async run() {
        console.log('🛡️ BACKUP PRE-DEPLOY PARA EASYPANEL');
        console.log('==================================================');

        this.ensureBackupDirectory();

        const dbBackup = await this.backupProductionDB();
        const manifest = await this.createManifest(dbBackup);

        console.log('==================================================');
        console.log('✅ BACKUP PRE-DEPLOY COMPLETADO');
        console.log(`📦 BD: ${dbBackup}`);
        console.log('');
        console.log('🚀 PRÓXIMOS PASOS:');
        console.log('1. git push origin main');
        console.log('2. EasyPanel hará auto-deploy');
        console.log('3. Verificar que todo funcione');
        console.log('4. Si hay problemas: node scripts/restore_backup.js');

        return manifest;
    }
}

// Ejecutar
const backup = new PreDeployBackup();
backup.run().catch(error => {
    console.error('💥 FALLO EN BACKUP PRE-DEPLOY:', error.message);
    process.exit(1);
});