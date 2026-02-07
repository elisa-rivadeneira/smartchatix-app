#!/usr/bin/env node

// 🚀 POST-DEPLOY SETUP (ejecutar en contenedor después del auto-deploy)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PostDeploySetup {
    constructor() {
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.dbPath = '/app/data/users.db';
    }

    async backupCurrentDB() {
        if (fs.existsSync(this.dbPath)) {
            const backupPath = `/app/backups/post_deploy_${this.timestamp}.db`;

            // Crear directorio si no existe
            const backupDir = path.dirname(backupPath);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            fs.copyFileSync(this.dbPath, backupPath);
            console.log(`✅ Backup post-deploy: ${backupPath}`);
            return backupPath;
        }
        return null;
    }

    async runMigrations() {
        console.log('🔧 Aplicando migraciones...');

        const migrationScript = path.join(__dirname, 'fix_schema_with_node.js');

        if (fs.existsSync(migrationScript)) {
            try {
                execSync(`node ${migrationScript}`, { stdio: 'inherit' });
                console.log('✅ Migraciones aplicadas');
            } catch (error) {
                console.error('❌ Error en migraciones:', error.message);
                throw error;
            }
        } else {
            console.log('⚠️ Script de migración no encontrado');
        }
    }

    async installDependencies() {
        console.log('📦 Instalando dependencias...');

        if (fs.existsSync('/app/package.json')) {
            try {
                execSync('npm install --production', {
                    cwd: '/app',
                    stdio: 'inherit'
                });
                console.log('✅ Dependencias instaladas');
            } catch (error) {
                console.error('❌ Error instalando dependencias:', error.message);
            }
        }
    }

    async verifySystem() {
        console.log('🔍 Verificando sistema...');

        // Verificar BD
        if (fs.existsSync(this.dbPath)) {
            const stats = fs.statSync(this.dbPath);
            console.log(`✅ BD OK (${stats.size} bytes)`);
        } else {
            throw new Error('Base de datos no encontrada');
        }

        // Verificar archivos principales
        const criticalFiles = ['/app/server.js', '/app/package.json'];

        for (const file of criticalFiles) {
            if (fs.existsSync(file)) {
                console.log(`✅ ${path.basename(file)} OK`);
            } else {
                throw new Error(`Archivo crítico faltante: ${file}`);
            }
        }
    }

    async run() {
        console.log('🚀 SETUP POST-DEPLOY EASYPANEL');
        console.log('==================================================');

        try {
            // 1. Backup de seguridad
            await this.backupCurrentDB();

            // 2. Instalar dependencias
            await this.installDependencies();

            // 3. Aplicar migraciones
            await this.runMigrations();

            // 4. Verificar sistema
            await this.verifySystem();

            console.log('==================================================');
            console.log('✅ POST-DEPLOY SETUP COMPLETADO');
            console.log('🔄 Reinicia tu aplicación si es necesario');

        } catch (error) {
            console.error('💥 FALLO EN POST-DEPLOY SETUP:', error.message);
            process.exit(1);
        }
    }
}

// Ejecutar
const setup = new PostDeploySetup();
setup.run();