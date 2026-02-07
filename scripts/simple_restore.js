#!/usr/bin/env node

// 🔄 RESTAURAR SIMPLE

const fs = require('fs');
const path = require('path');

class SimpleRestore {
    constructor() {
        this.backupDir = '/app/backups/pre_deploy';
        this.dbPath = '/app/data/users.db';
    }

    listBackups() {
        if (!fs.existsSync(this.backupDir)) {
            console.log('❌ No hay backups');
            return [];
        }

        const backups = fs.readdirSync(this.backupDir)
            .filter(f => f.endsWith('.db'))
            .map(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    file,
                    path: filePath,
                    date: stats.mtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.date - a.date);

        console.log('📋 BACKUPS DISPONIBLES:');
        backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.file}`);
            console.log(`   📅 ${backup.date.toLocaleString()}`);
            console.log(`   📦 ${(backup.size / 1024).toFixed(2)} KB`);
            console.log('');
        });

        return backups;
    }

    async restoreLatest() {
        const backups = this.listBackups();

        if (backups.length === 0) {
            throw new Error('No hay backups disponibles');
        }

        const latest = backups[0];
        console.log(`🔄 Restaurando: ${latest.file}`);

        // Hacer backup del actual antes de restaurar
        if (fs.existsSync(this.dbPath)) {
            const currentBackup = `${this.dbPath}.before_restore`;
            fs.copyFileSync(this.dbPath, currentBackup);
            console.log(`💾 BD actual respaldada en: ${currentBackup}`);
        }

        // Restaurar
        fs.copyFileSync(latest.path, this.dbPath);
        console.log(`✅ BD restaurada desde: ${latest.file}`);
    }

    async run() {
        const command = process.argv[2];

        console.log('🔄 RESTAURADOR SIMPLE');
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
                console.log('  node scripts/simple_restore.js list     - Ver backups');
                console.log('  node scripts/simple_restore.js restore  - Restaurar último');
                break;
        }
    }
}

// Ejecutar
const restore = new SimpleRestore();
restore.run().catch(error => {
    console.error('💥 ERROR:', error.message);
    process.exit(1);
});