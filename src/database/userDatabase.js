const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

// Función para generar UUID compatible
const uuidv4 = () => {
  return crypto.randomUUID();
};

class UserDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/users.db');
    this.db = null;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.isReady = false;
    this.initDatabase().then(() => {
      this.isReady = true;
    }).catch(err => {
      console.error('Error en inicialización de BD:', err);
    });
  }

  async initDatabase() {
    try {
      // Crear directorio de datos si no existe
      await fs.ensureDir(path.dirname(this.dbPath));

      // Crear/conectar base de datos de forma síncrona
      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, async (err) => {
          if (err) {
            console.error('Error conectando a la base de datos:', err);
            reject(err);
            return;
          }
          console.log('✅ Conectado a la base de datos SQLite');

          try {
            // Crear tablas después de que la conexión esté lista
            await this.createTables();
            resolve();
          } catch (tableError) {
            reject(tableError);
          }
        });
      });
    } catch (error) {
      console.error('Error inicializando base de datos:', error);
      throw error;
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Tabla de usuarios
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          is_active BOOLEAN DEFAULT 1,
          subscription_type TEXT DEFAULT 'free'
        )`,

        // Tabla de proyectos por usuario
        `CREATE TABLE IF NOT EXISTS user_projects (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT DEFAULT 'media',
          status TEXT DEFAULT 'activo',
          progress INTEGER DEFAULT 0,
          deadline TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de tareas por proyecto
        `CREATE TABLE IF NOT EXISTS project_tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT 0,
          progress INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES user_projects (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de tareas diarias por usuario
        `CREATE TABLE IF NOT EXISTS daily_tasks (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          text TEXT NOT NULL,
          completed BOOLEAN DEFAULT 0,
          project_id TEXT,
          project_task_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES user_projects (id) ON DELETE SET NULL,
          FOREIGN KEY (project_task_id) REFERENCES project_tasks (id) ON DELETE SET NULL
        )`,

        // Tabla de configuración del asistente por usuario
        `CREATE TABLE IF NOT EXISTS user_assistant_config (
          user_id TEXT PRIMARY KEY,
          base_prompt TEXT,
          system_prompt TEXT,
          user_name TEXT,
          assistant_name TEXT DEFAULT 'Elon Musk',
          specialties TEXT, -- JSON array
          tone TEXT DEFAULT 'Motivador',
          focus_areas TEXT, -- JSON object
          memory TEXT, -- JSON object
          voice_enabled BOOLEAN DEFAULT 1,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de historial de chat por usuario
        `CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL, -- 'user' o 'assistant'
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          function_results TEXT, -- JSON
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de sesiones activas
        `CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de insights del asistente (memoria conversacional)
        `CREATE TABLE IF NOT EXISTS assistant_insights (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          insight_type TEXT NOT NULL, -- 'achievement', 'pattern', 'challenge', 'goal'
          content TEXT NOT NULL,
          context TEXT, -- contexto del proyecto/tarea relacionado
          importance_level INTEGER DEFAULT 3, -- 1-5, 5 siendo más importante
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_mentioned DATETIME,
          mention_count INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de compromisos y seguimientos
        `CREATE TABLE IF NOT EXISTS user_commitments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          commitment TEXT NOT NULL,
          deadline DATE,
          status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'overdue'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          follow_up_count INTEGER DEFAULT 0,
          last_follow_up DATETIME,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de logros y milestones
        `CREATE TABLE IF NOT EXISTS user_achievements (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          achievement TEXT NOT NULL,
          achievement_type TEXT, -- 'task_completion', 'project_milestone', 'habit_formation'
          related_project_id TEXT,
          celebration_level INTEGER DEFAULT 3, -- 1-5
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          acknowledged BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`
      ];

      let completed = 0;
      const total = queries.length;

      queries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error(`Error creando tabla ${index + 1}:`, err);
            reject(err);
            return;
          }

          completed++;
          if (completed === total) {
            console.log('✅ Todas las tablas creadas exitosamente');
            resolve();
          }
        });
      });
    });
  }

  // Método para esperar que la BD esté lista
  async waitForReady() {
    if (this.isReady) return;

    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.isReady) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  // Métodos de autenticación
  async registerUser(email, password, name) {
    await this.waitForReady();
    return new Promise((resolve, reject) => {
      const userId = uuidv4();
      const saltRounds = 10;
      const db = this.db; // Guardar referencia al objeto db

      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
          reject(err);
          return;
        }

        const query = `
          INSERT INTO users (id, email, password, name)
          VALUES (?, ?, ?, ?)
        `;

        db.run(query, [userId, email, hashedPassword, name], function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('El email ya está registrado'));
            } else {
              reject(err);
            }
            return;
          }

          // Crear configuración inicial del asistente
          const defaultConfig = {
            base_prompt: "Eres mi asistente coach personal para ayudarme a impulsar al máximo todos mis proyectos con éxito. Me vas a ayudar con estrategias, motivación y seguimiento de mis objetivos. Siempre serás directo, práctico y orientado a resultados.",
            system_prompt: "Eres mi asistente coach personal para ayudarme a impulsar al máximo todos mis proyectos con éxito. Me vas a ayudar con estrategias, motivación y seguimiento de mis objetivos. Siempre serás directo, práctico y orientado a resultados.",
            user_name: name,
            assistant_name: 'Elon Musk',
            specialties: JSON.stringify(['Desarrollo de Software']),
            tone: 'Motivador',
            focus_areas: JSON.stringify({
              proyectos: true,
              tareas: true,
              aprendizaje: false,
              habitos: false
            }),
            memory: JSON.stringify({
              personalityTraits: '',
              motivationalTriggers: '',
              challengesAndStruggles: '',
              achievements: '',
              learningStyle: '',
              workPatterns: '',
              emotionalContext: '',
              growthAreas: '',
              currentPriorities: ''
            })
          };

          const configQuery = `
            INSERT INTO user_assistant_config (
              user_id, base_prompt, system_prompt, user_name, assistant_name,
              specialties, tone, focus_areas, memory
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(configQuery, [
            userId,
            defaultConfig.base_prompt,
            defaultConfig.system_prompt,
            defaultConfig.user_name,
            defaultConfig.assistant_name,
            defaultConfig.specialties,
            defaultConfig.tone,
            defaultConfig.focus_areas,
            defaultConfig.memory
          ], (configErr) => {
            if (configErr) {
              console.error('Error creando configuración inicial:', configErr);
            }

            resolve({
              id: userId,
              email,
              name,
              created_at: new Date().toISOString()
            });
          });
        });
      });
    });
  }

  async loginUser(email, password) {
    await this.waitForReady();
    return new Promise((resolve, reject) => {
      const db = this.db; // Guardar referencia al objeto db
      const query = `
        SELECT id, email, password, name, avatar, last_login, is_active
        FROM users WHERE email = ? AND is_active = 1
      `;

      db.get(query, [email], (err, user) => {
        if (err) {
          reject(err);
          return;
        }

        if (!user) {
          reject(new Error('Usuario no encontrado o inactivo'));
          return;
        }

        bcrypt.compare(password, user.password, (bcryptErr, isValid) => {
          if (bcryptErr) {
            reject(bcryptErr);
            return;
          }

          if (!isValid) {
            reject(new Error('Contraseña incorrecta'));
            return;
          }

          // Actualizar último login
          const updateQuery = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
          db.run(updateQuery, [user.id]);

          // Generar token JWT
          const token = jwt.sign(
            { userId: user.id, email: user.email },
            this.jwtSecret,
            { expiresIn: '7d' }
          );

          // Guardar sesión
          const sessionId = uuidv4();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

          const sessionQuery = `
            INSERT INTO user_sessions (id, user_id, token, expires_at)
            VALUES (?, ?, ?, ?)
          `;

          db.run(sessionQuery, [sessionId, user.id, token, expiresAt.toISOString()], (sessionErr) => {
            if (sessionErr) {
              console.error('Error guardando sesión:', sessionErr);
            }

            resolve({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar
              },
              token,
              expiresAt: expiresAt.toISOString()
            });
          });
        });
      });
    });
  }

  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, (err, decoded) => {
        if (err) {
          reject(new Error('Token inválido'));
          return;
        }

        // Verificar que la sesión exista y no haya expirado
        const query = `
          SELECT s.*, u.email, u.name, u.avatar
          FROM user_sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
        `;

        this.db.get(query, [token], (dbErr, session) => {
          if (dbErr) {
            reject(dbErr);
            return;
          }

          if (!session) {
            reject(new Error('Sesión expirada o inválida'));
            return;
          }

          resolve({
            userId: session.user_id,
            email: session.email,
            name: session.name,
            avatar: session.avatar
          });
        });
      });
    });
  }

  async logoutUser(token) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM user_sessions WHERE token = ?';

      this.db.run(query, [token], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ success: true });
      });
    });
  }

  // Métodos para datos de usuario
  async getUserProjects(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM user_projects
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;

      this.db.all(query, [userId], (err, projects) => {
        if (err) {
          reject(err);
          return;
        }

        // Obtener tareas para cada proyecto
        const projectPromises = projects.map(project => {
          return new Promise((taskResolve, taskReject) => {
            const taskQuery = `
              SELECT * FROM project_tasks
              WHERE project_id = ?
              ORDER BY created_at DESC
            `;

            this.db.all(taskQuery, [project.id], (taskErr, tasks) => {
              if (taskErr) {
                taskReject(taskErr);
                return;
              }

              taskResolve({
                ...project,
                tasks: tasks || []
              });
            });
          });
        });

        Promise.all(projectPromises)
          .then(projectsWithTasks => resolve(projectsWithTasks))
          .catch(reject);
      });
    });
  }

  async getUserDailyTasks(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM daily_tasks
        WHERE user_id = ? AND (archived = 0 OR archived IS NULL)
        ORDER BY created_at DESC
      `;

      this.db.all(query, [userId], (err, tasks) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(tasks || []);
      });
    });
  }

  async getProjectDailyTasks(userId, projectId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM daily_tasks
        WHERE user_id = ? AND project_id = ? AND (archived = 0 OR archived IS NULL)
        ORDER BY created_at DESC
      `;

      this.db.all(query, [userId, projectId], (err, tasks) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(tasks || []);
      });
    });
  }

  async getUserAssistantConfig(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM user_assistant_config
        WHERE user_id = ?
      `;

      this.db.get(query, [userId], (err, config) => {
        if (err) {
          reject(err);
          return;
        }

        if (!config) {
          reject(new Error('Configuración de asistente no encontrada'));
          return;
        }

        // Parsear campos JSON
        try {
          resolve({
            ...config,
            specialties: JSON.parse(config.specialties || '[]'),
            focus_areas: JSON.parse(config.focus_areas || '{}'),
            memory: JSON.parse(config.memory || '{}')
          });
        } catch (parseErr) {
          reject(new Error('Error parseando configuración'));
        }
      });
    });
  }

  async createProject(userId, projectData) {
    return new Promise((resolve, reject) => {
      const projectId = uuidv4();

      const query = `
        INSERT INTO user_projects (
          id, user_id, title, description, priority, status, progress, deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        projectId,
        userId,
        projectData.title,
        projectData.description || '',
        projectData.priority || 'media',
        projectData.status || 'active',
        projectData.progress || 0,
        projectData.deadline || null
      ];

      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
          return;
        }

        // Devolver el proyecto creado con el mismo formato que el frontend espera
        resolve({
          id: projectId,
          title: projectData.title,
          description: projectData.description || '',
          priority: projectData.priority || 'media',
          status: projectData.status || 'active',
          progress: projectData.progress || 0,
          deadline: projectData.deadline || '',
          createdAt: new Date().toISOString(),
          tasks: []
        });
      });
    });
  }

  async updateDailyTaskCompletion(userId, taskId, completed) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE daily_tasks
        SET completed = ?
        WHERE id = ? AND user_id = ?
      `;

      this.db.run(query, [completed ? 1 : 0, taskId, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error('Tarea no encontrada o no pertenece al usuario'));
          return;
        }

        resolve({ success: true, taskId, completed });
      });
    });
  }

  async deleteDailyTask(userId, taskId) {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM daily_tasks
        WHERE id = ? AND user_id = ?
      `;

      this.db.run(query, [taskId, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error('Tarea no encontrada o no pertenece al usuario'));
          return;
        }

        resolve({ success: true, taskId });
      });
    });
  }

  async archiveDailyTask(userId, taskId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE daily_tasks
        SET archived = 1, completed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;

      this.db.run(query, [taskId, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error('Tarea no encontrada o no pertenece al usuario'));
          return;
        }

        resolve({ success: true, taskId });
      });
    });
  }

  async unarchiveDailyTask(userId, taskId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE daily_tasks
        SET archived = 0, completed = 0, completed_at = NULL
        WHERE id = ? AND user_id = ?
      `;

      this.db.run(query, [taskId, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error('Tarea no encontrada o no pertenece al usuario'));
          return;
        }

        resolve({ success: true, taskId });
      });
    });
  }

  async createDailyTask(userId, taskData) {
    return new Promise((resolve, reject) => {
      const taskId = uuidv4();
      const query = `
        INSERT INTO daily_tasks (id, user_id, text, completed, project_id, project_task_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        taskId,
        userId,
        taskData.text,
        taskData.completed || false,
        taskData.projectId || null,
        taskData.projectTaskId || null
      ];

      this.db.run(query, values, function(err) {
        if (err) {
          console.error('Error creating daily task:', err);
          reject(err);
          return;
        }

        resolve({
          id: taskId,
          user_id: userId,
          text: taskData.text,
          completed: taskData.completed || false,
          project_id: taskData.projectId || null,
          project_task_id: taskData.projectTaskId || null,
          created_at: new Date().toISOString()
        });
      });
    });
  }

  async getUserArchivedTasks(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM daily_tasks
        WHERE user_id = ? AND archived = 1
        ORDER BY completed_at DESC
      `;

      this.db.all(query, [userId], (err, tasks) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(tasks || []);
      });
    });
  }

  // Cerrar conexión
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error cerrando base de datos:', err);
        } else {
          console.log('✅ Base de datos cerrada');
        }
      });
    }
  }
}

module.exports = UserDatabase;