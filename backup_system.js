const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

/**
 * Sistema de Backup Automático para Base de Datos
 *
 * Este sistema crea backups automáticos de la base de datos
 * sin incluirlos en git para proteger datos de usuarios.
 */

class DatabaseBackupSystem {
  constructor() {
    this.dbPath = path.join(__dirname, 'data/users.db');
    this.backupDir = path.join(__dirname, 'backups');
    this.maxBackups = 30; // Mantener 30 backups
  }

  async init() {
    // Crear directorio de backups si no existe
    await fs.ensureDir(this.backupDir);

    // Asegurar que backups/ esté en .gitignore
    await this.ensureGitIgnore();
  }

  async ensureGitIgnore() {
    const gitignorePath = path.join(__dirname, '.gitignore');
    let gitignoreContent = '';

    if (await fs.pathExists(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    }

    const backupRules = [
      '# Database backups (never commit user data)',
      'backups/',
      'data/users.db',
      'data/users_*.db',
      '*.db.backup',
      '# User uploads',
      'uploads/',
      '# User logs and memory',
      'auth_logs.json',
      'user_memory.json'
    ];

    let needsUpdate = false;
    for (const rule of backupRules) {
      if (!gitignoreContent.includes(rule)) {
        gitignoreContent += '\n' + rule;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log('✅ .gitignore actualizado para proteger datos de usuarios');
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `users_${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      if (await fs.pathExists(this.dbPath)) {
        await fs.copy(this.dbPath, backupPath);
        console.log(`✅ Backup creado: ${backupFileName}`);

        // Limpiar backups antiguos
        await this.cleanOldBackups();

        return backupPath;
      } else {
        console.log('⚠️  Base de datos no encontrada');
        return null;
      }
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      return null;
    }
  }

  async cleanOldBackups() {
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      const dbBackups = backupFiles
        .filter(file => file.startsWith('users_') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stat: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // Más recientes primero

      // Mantener solo los más recientes
      if (dbBackups.length > this.maxBackups) {
        const toDelete = dbBackups.slice(this.maxBackups);
        for (const backup of toDelete) {
          await fs.remove(backup.path);
          console.log(`🗑️  Backup antiguo eliminado: ${backup.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error limpiando backups antiguos:', error);
    }
  }

  async listBackups() {
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      const dbBackups = backupFiles
        .filter(file => file.startsWith('users_') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          size: fs.statSync(path.join(this.backupDir, file)).size,
          date: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.date - a.date);

      console.log('\n📚 Backups disponibles:');
      console.log('========================');

      if (dbBackups.length === 0) {
        console.log('No hay backups disponibles');
        return [];
      }

      dbBackups.forEach((backup, index) => {
        const sizeKB = (backup.size / 1024).toFixed(2);
        console.log(`${index + 1}. ${backup.name}`);
        console.log(`   📅 ${backup.date.toLocaleString()}`);
        console.log(`   📊 ${sizeKB} KB`);
        console.log('');
      });

      return dbBackups;
    } catch (error) {
      console.error('❌ Error listando backups:', error);
      return [];
    }
  }

  async restoreBackup(backupFileName) {
    const backupPath = path.join(this.backupDir, backupFileName);
    const currentDbBackup = path.join(this.backupDir, `users_before_restore_${Date.now()}.db`);

    try {
      // Backup de la BD actual antes de restaurar
      if (await fs.pathExists(this.dbPath)) {
        await fs.copy(this.dbPath, currentDbBackup);
        console.log(`💾 BD actual guardada como backup en: ${path.basename(currentDbBackup)}`);
      }

      // Restaurar el backup
      if (await fs.pathExists(backupPath)) {
        await fs.copy(backupPath, this.dbPath);
        console.log(`✅ Base de datos restaurada desde: ${backupFileName}`);
        return true;
      } else {
        console.log(`❌ Backup no encontrado: ${backupFileName}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error restaurando backup:', error);
      return false;
    }
  }

  // Crear backup automático al iniciar servidor
  async scheduleBackups() {
    // Backup inmediato al iniciar
    await this.createBackup();

    // Backup cada 4 horas
    setInterval(async () => {
      console.log('🔄 Creando backup automático...');
      await this.createBackup();
    }, 4 * 60 * 60 * 1000); // 4 horas

    console.log('⏰ Sistema de backup automático iniciado (cada 4 horas)');
  }
}

// Funciones de utilidad para usar desde línea de comandos
async function createManualBackup() {
  const backupSystem = new DatabaseBackupSystem();
  await backupSystem.init();
  const backup = await backupSystem.createBackup();

  if (backup) {
    console.log('\n🎉 Backup manual creado exitosamente');
  } else {
    console.log('\n❌ Error creando backup manual');
  }
}

async function listAllBackups() {
  const backupSystem = new DatabaseBackupSystem();
  await backupSystem.init();
  await backupSystem.listBackups();
}

async function restoreFromBackup(backupFileName) {
  const backupSystem = new DatabaseBackupSystem();
  await backupSystem.init();

  if (!backupFileName) {
    console.log('❌ Especifica el nombre del archivo de backup');
    console.log('💡 Usa: node backup_system.js restore <nombre-archivo>');
    return;
  }

  const success = await backupSystem.restoreBackup(backupFileName);
  if (success) {
    console.log('\n🎉 Restauración completada');
    console.log('⚠️  Reinicia el servidor para que tome efecto');
  }
}

// CLI
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'backup':
      createManualBackup();
      break;
    case 'list':
      listAllBackups();
      break;
    case 'restore':
      restoreFromBackup(arg);
      break;
    default:
      console.log('🛠️  Sistema de Backup de Base de Datos');
      console.log('=====================================');
      console.log('');
      console.log('Comandos disponibles:');
      console.log('  node backup_system.js backup   - Crear backup manual');
      console.log('  node backup_system.js list     - Listar todos los backups');
      console.log('  node backup_system.js restore <archivo> - Restaurar backup');
      console.log('');
      console.log('El sistema también crea backups automáticos cada 4 horas');
      console.log('cuando el servidor está corriendo.');
  }
}

module.exports = DatabaseBackupSystem;