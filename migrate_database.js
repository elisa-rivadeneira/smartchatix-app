const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrateDatabase() {
  const dbPath = path.join(__dirname, 'data/users.db');

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error conectando a la base de datos:', err);
        reject(err);
        return;
      }
      console.log('✅ Conectado a la base de datos para migración');

      const migrations = [
        // Migración 1: Tabla de detalles de tareas (task_details)
        `CREATE TABLE IF NOT EXISTS task_details (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          description TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES daily_tasks (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Migración 2: Tabla de subtareas (task_subtasks)
        `CREATE TABLE IF NOT EXISTS task_subtasks (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          text TEXT NOT NULL,
          completed BOOLEAN DEFAULT 0,
          order_index INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES daily_tasks (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Migración 3: Tabla de archivos adjuntos (task_attachments)
        `CREATE TABLE IF NOT EXISTS task_attachments (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          is_image BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES daily_tasks (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Migración 4: Tabla de insights del asistente (assistant_insights)
        `CREATE TABLE IF NOT EXISTS assistant_insights (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          insight_type TEXT NOT NULL,
          content TEXT NOT NULL,
          context TEXT,
          importance_level INTEGER DEFAULT 3,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_mentioned DATETIME,
          mention_count INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Migración 5: Tabla de compromisos (user_commitments)
        `CREATE TABLE IF NOT EXISTS user_commitments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          commitment TEXT NOT NULL,
          deadline DATE,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          follow_up_count INTEGER DEFAULT 0,
          last_follow_up DATETIME,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Migración 6: Tabla de logros (user_achievements)
        `CREATE TABLE IF NOT EXISTS user_achievements (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          achievement TEXT NOT NULL,
          achievement_type TEXT,
          related_project_id TEXT,
          celebration_level INTEGER DEFAULT 3,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          acknowledged BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`
      ];

      let completed = 0;
      const total = migrations.length;

      console.log(`📋 Ejecutando ${total} migraciones de base de datos...`);

      migrations.forEach((migration, index) => {
        db.run(migration, function(err) {
          if (err) {
            console.error(`❌ Error en migración ${index + 1}:`, err);
            reject(err);
            return;
          }

          completed++;
          console.log(`✅ Migración ${completed}/${total} completada`);

          if (completed === total) {
            console.log('🎉 Todas las migraciones completadas exitosamente');
            console.log('✨ La base de datos está actualizada y lista');
            db.close((closeErr) => {
              if (closeErr) {
                console.error('Error cerrando base de datos:', closeErr);
              } else {
                console.log('📝 Conexión a base de datos cerrada');
              }
              resolve();
            });
          }
        });
      });
    });
  });
}

// Ejecutar migración
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('✅ Proceso de migración completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error durante la migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };