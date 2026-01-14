const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

async function recoverDatabase() {
  console.log('🚑 Script de Recuperación de Base de Datos');
  console.log('=====================================');

  const dbPath = path.join(__dirname, 'data/users.db');
  const backupPath = path.join(__dirname, 'data/users_backup.db');

  try {
    // Opción 1: Crear backup de la BD actual
    console.log('📋 Opción 1: Crear backup de BD actual...');
    if (fs.existsSync(dbPath)) {
      await fs.copy(dbPath, backupPath);
      console.log('✅ Backup creado en: data/users_backup.db');
    }

    // Opción 2: Recuperar desde git commit específico
    console.log('\n📋 Opción 2: Comandos para recuperar desde git:');
    console.log('Para recuperar BD del commit antes del último:');
    console.log('git show b829e4a:data/users.db > data/users_recovered.db');
    console.log('');
    console.log('Para revertir solo la BD al estado anterior:');
    console.log('git checkout b829e4a -- data/users.db');
    console.log('');

    // Opción 3: Verificar estado actual
    console.log('📋 Opción 3: Verificando estado actual...');

    return new Promise((resolve) => {
      exec('sqlite3 data/users.db "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM user_projects; SELECT COUNT(*) FROM daily_tasks;"',
        (error, stdout) => {
          if (error) {
            console.log('❌ Error verificando BD:', error.message);
            resolve();
            return;
          }

          const lines = stdout.trim().split('\n');
          console.log(`✅ Estado actual: ${lines[0]} usuarios, ${lines[1]} proyectos, ${lines[2]} tareas`);
          console.log('');

          if (parseInt(lines[0]) > 0 && parseInt(lines[1]) > 0 && parseInt(lines[2]) > 0) {
            console.log('🎉 ¡La base de datos parece estar bien!');
            console.log('💡 No se requiere recuperación.');
          } else {
            console.log('⚠️  La base de datos podría tener problemas.');
            console.log('🔧 Ejecuta uno de los comandos de recuperación arriba.');
          }

          resolve();
        });
    });

  } catch (error) {
    console.error('💥 Error durante la recuperación:', error);
  }
}

// Función para recuperar automáticamente desde git
async function autoRecover() {
  console.log('🤖 Recuperación automática desde git...');

  return new Promise((resolve, reject) => {
    // Recuperar la BD del commit anterior a la subida accidental
    exec('git show b829e4a:data/users.db > data/users_recovered.db', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error en recuperación automática:', error);
        reject(error);
        return;
      }

      console.log('✅ Base de datos recuperada en: data/users_recovered.db');
      console.log('📋 Para usar la BD recuperada:');
      console.log('   mv data/users.db data/users_problem.db');
      console.log('   mv data/users_recovered.db data/users.db');

      resolve();
    });
  });
}

// Función para listar todos los commits con BD disponibles
async function listAvailableBackups() {
  console.log('📚 Commits disponibles para recuperación:');

  return new Promise((resolve) => {
    exec('git log --oneline --follow data/users.db | head -10', (error, stdout) => {
      if (error) {
        console.log('❌ Error listando commits:', error.message);
        resolve();
        return;
      }

      console.log(stdout);
      console.log('💡 Para recuperar desde cualquier commit:');
      console.log('   git show <commit-hash>:data/users.db > data/users_recovered.db');

      resolve();
    });
  });
}

// Ejecutar según argumentos
if (require.main === module) {
  const arg = process.argv[2];

  if (arg === 'auto') {
    autoRecover()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (arg === 'list') {
    listAvailableBackups()
      .then(() => process.exit(0));
  } else {
    recoverDatabase()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = { recoverDatabase, autoRecover, listAvailableBackups };