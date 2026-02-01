const sqlite3 = require('sqlite3').verbose();

class DatabaseMigrations {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.migrations = [
      {
        version: 1,
        description: 'Add archived column to tasks tables',
        up: async (migrationInstance) => {
          console.log('🔧 Running migration: Add archived column...');

          // Ensure daily_tasks table exists first
          await migrationInstance.runQuery(`
            CREATE TABLE IF NOT EXISTS daily_tasks (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              text TEXT NOT NULL,
              completed INTEGER DEFAULT 0,
              project_id TEXT,
              project_task_id TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              completed_at DATETIME,
              task_order INTEGER
            )
          `);

          // Check if archived column exists in daily_tasks table
          try {
            await migrationInstance.runQuery('ALTER TABLE daily_tasks ADD COLUMN archived INTEGER DEFAULT 0');
            console.log('✅ Added archived column to daily_tasks table');
          } catch (error) {
            if (error.message.includes('duplicate column name')) {
              console.log('✅ archived column already exists in daily_tasks table');
            } else {
              console.log('ℹ️ daily_tasks table issue:', error.message);
            }
          }

          // Ensure tasks table exists first (if used)
          await migrationInstance.runQuery(`
            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              text TEXT NOT NULL,
              completed INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Check if archived column exists in tasks table
          try {
            await migrationInstance.runQuery('ALTER TABLE tasks ADD COLUMN archived INTEGER DEFAULT 0');
            console.log('✅ Added archived column to tasks table');
          } catch (error) {
            if (error.message.includes('duplicate column name')) {
              console.log('✅ archived column already exists in tasks table');
            } else {
              console.log('ℹ️ tasks table issue:', error.message);
            }
          }
        }
      },
      {
        version: 2,
        description: 'Add archived column to all remaining tables',
        up: async (migrationInstance) => {
          console.log('🔧 Running migration: Add archived to all tables...');

          const tables = ['users', 'projects', 'user_sessions'];

          for (const table of tables) {
            try {
              await migrationInstance.runQuery(`ALTER TABLE ${table} ADD COLUMN archived INTEGER DEFAULT 0`);
              console.log(`✅ Added archived column to ${table} table`);
            } catch (error) {
              if (error.message.includes('duplicate column name') || error.message.includes('no such table')) {
                console.log(`ℹ️ Table ${table} already has archived column or doesn't exist`);
              } else {
                console.log(`ℹ️ ${table} table issue:`, error.message);
              }
            }
          }
        }
      }
      // Future migrations go here
    ];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async runMigrations() {
    console.log('🔄 Checking database migrations...');

    await this.connect();

    // Create migrations table if it doesn't exist
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get current migration version
    const currentVersionResult = await this.getQuery(
      'SELECT MAX(version) as version FROM schema_migrations'
    );

    const currentVersion = currentVersionResult?.version || 0;
    console.log(`📊 Current database version: ${currentVersion}`);

    // Run pending migrations
    let migrationsRun = 0;
    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        console.log(`🚀 Running migration ${migration.version}: ${migration.description}`);

        try {
          // Run the migration
          await migration.up(this);

          // Record the migration
          await this.runQuery(`
            INSERT INTO schema_migrations (version, description)
            VALUES (?, ?)
          `, [migration.version, migration.description]);

          migrationsRun++;
          console.log(`✅ Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`❌ Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
    }

    if (migrationsRun === 0) {
      console.log('✅ Database is up to date, no migrations needed');
    } else {
      console.log(`✅ Completed ${migrationsRun} migration(s)`);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseMigrations;