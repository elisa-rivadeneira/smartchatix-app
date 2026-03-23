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
    // SIEMPRE usar /data/ directorio para volumen persistente
    // En producción EasyPanel: /data/users.db
    // En desarrollo: ./data/users.db
    if (process.env.NODE_ENV === 'production') {
      this.dbPath = '/app/data/users.db';
    } else {
      this.dbPath = path.join(__dirname, '../../data/users.db');
    }
    console.log(`📁 [VOLUMEN PERSISTENTE] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`📁 [VOLUMEN PERSISTENTE] Usando base de datos en: ${this.dbPath}`);
    console.log(`📁 [VOLUMEN PERSISTENTE] __dirname actual: ${__dirname}`);
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
          task_order INTEGER DEFAULT 0,
          archived INTEGER DEFAULT 0,
          completed_at DATETIME DEFAULT NULL,
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

        // Tabla de contenido detallado de tareas
        `CREATE TABLE IF NOT EXISTS task_details (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          description TEXT, -- Contenido en formato HTML/markdown
          notes TEXT, -- Notas adicionales
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES daily_tasks (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Tabla de subtareas/checklist
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

        // Tabla de archivos adjuntos
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

            // Ejecutar migraciones
            this.runMigrations().then(() => {
              resolve();
            }).catch((err) => {
              console.error('Error en migraciones:', err);
              resolve(); // No fallar si las migraciones fallan
            });
          }
        });
      });
    });
  }

  // Ejecutar migraciones de base de datos
  async runMigrations() {
    return new Promise((resolve, reject) => {
      // Migración: Agregar campo task_order a daily_tasks si no existe
      this.db.all("PRAGMA table_info(daily_tasks)", (err, columns) => {
        if (err) {
          console.error('Error verificando estructura de daily_tasks:', err);
          return reject(err);
        }

        const hasTaskOrder = columns.some(col => col.name === 'task_order');

        if (!hasTaskOrder) {
          console.log('🔄 Agregando campo task_order a daily_tasks...');
          this.db.run("ALTER TABLE daily_tasks ADD COLUMN task_order INTEGER DEFAULT 0", (alterErr) => {
            if (alterErr) {
              console.error('Error agregando campo task_order:', alterErr);
              return reject(alterErr);
            }
            console.log('✅ Campo task_order agregado exitosamente');
            resolve();
          });
        } else {
          console.log('✅ Campo task_order ya existe');
          resolve();
        }
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
          SELECT s.*, u.email, u.name, u.avatar, u.subscription_type
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
            avatar: session.avatar,
            subscription_type: session.subscription_type
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

        // Obtener tareas para cada proyecto (project_tasks Y daily_tasks asignadas)
        const projectPromises = projects.map(project => {
          return new Promise((taskResolve, taskReject) => {
            // Consulta para project_tasks
            const projectTasksQuery = `
              SELECT *, 'project_task' as task_type FROM project_tasks
              WHERE project_id = ?
              ORDER BY created_at DESC
            `;

            // Consulta para daily_tasks asignadas
            const dailyTasksQuery = `
              SELECT *, 'daily_task' as task_type FROM daily_tasks
              WHERE project_id = ? AND archived = 0
              ORDER BY created_at DESC
            `;

            this.db.all(projectTasksQuery, [project.id], (err1, projectTasks) => {
              if (err1) {
                taskReject(err1);
                return;
              }

              this.db.all(dailyTasksQuery, [project.id], (err2, dailyTasks) => {
                if (err2) {
                  taskReject(err2);
                  return;
                }

                // Combinar ambos tipos de tareas
                const allTasks = [
                  ...(projectTasks || []),
                  ...(dailyTasks || [])
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                taskResolve({
                  ...project,
                  tasks: allTasks
                });
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
        ORDER BY task_order ASC, created_at DESC
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

  // ===================== MÉTODOS PARA CONTENIDO DETALLADO DE TAREAS =====================

  // Obtener detalles completos de una tarea
  async getTaskDetails(taskId, userId) {
    return new Promise((resolve, reject) => {
      console.log(`📋 [DB] getTaskDetails llamada para: { taskId: "${taskId}", userId: "${userId}" }`);

      // Primero obtener detalles básicos de task_details si existen
      const mainQuery = `SELECT * FROM task_details WHERE task_id = ? AND user_id = ?`;

      this.db.get(mainQuery, [taskId, userId], (err, taskDetails) => {
        if (err) {
          console.error(`❌ [DB] Error obteniendo task_details:`, err);
          reject(err);
          return;
        }

        console.log(`📝 [DB] task_details encontrado:`, taskDetails ? 'SÍ' : 'NO');

        // Obtener subtareas independientemente de si existe task_details
        const subtasksQuery = `
          SELECT id, text, completed, order_index
          FROM task_subtasks
          WHERE task_id = ? AND user_id = ?
          ORDER BY order_index
        `;

        this.db.all(subtasksQuery, [taskId, userId], (err, subtasks) => {
          if (err) {
            console.error(`❌ [DB] Error obteniendo subtareas:`, err);
            reject(err);
            return;
          }

          console.log(`📋 [DB] Subtareas encontradas: ${subtasks ? subtasks.length : 0}`);

          // Obtener attachments independientemente
          const attachmentsQuery = `
            SELECT id, filename, original_name, file_path, file_size, mime_type, is_image, created_at
            FROM task_attachments
            WHERE task_id = ? AND user_id = ?
          `;

          this.db.all(attachmentsQuery, [taskId, userId], (err, attachments) => {
            if (err) {
              console.error(`❌ [DB] Error obteniendo attachments:`, err);
              reject(err);
              return;
            }

            console.log(`📎 [DB] Attachments encontrados: ${attachments ? attachments.length : 0}`);

            // Construir resultado
            const result = {
              // Usar datos de task_details si existen, sino valores por defecto
              task_id: taskId,
              user_id: userId,
              description: taskDetails?.description || '',
              notes: taskDetails?.notes || '',
              // Siempre incluir subtareas y attachments
              subtasks: subtasks || [],
              attachments: attachments || []
            };

            console.log(`✅ [DB] Resultado final:`, {
              hasTaskDetails: !!taskDetails,
              subtasksCount: result.subtasks.length,
              attachmentsCount: result.attachments.length
            });

            resolve(result);
          });
        });
      });
    });
  }

  // Guardar detalles de tarea
  async saveTaskDetails(taskId, userId, detailsData) {
    return new Promise((resolve, reject) => {
      // Primero verificar si ya existe un registro
      const checkQuery = `SELECT id FROM task_details WHERE task_id = ? AND user_id = ?`;

      this.db.get(checkQuery, [taskId, userId], (err, existingRecord) => {
        if (err) {
          reject(err);
          return;
        }

        let query;
        let params;

        if (existingRecord) {
          // Actualizar registro existente
          query = `
            UPDATE task_details
            SET description = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE task_id = ? AND user_id = ?
          `;
          params = [
            detailsData.description || '',
            detailsData.notes || '',
            taskId,
            userId
          ];
        } else {
          // Crear nuevo registro
          const detailId = uuidv4();
          query = `
            INSERT INTO task_details (id, task_id, user_id, description, notes)
            VALUES (?, ?, ?, ?, ?)
          `;
          params = [
            detailId,
            taskId,
            userId,
            detailsData.description || '',
            detailsData.notes || ''
          ];
        }

        this.db.run(query, params, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: true,
            id: existingRecord ? existingRecord.id : params[0],
            updated: !!existingRecord
          });
        });
      });
    });
  }

  // Agregar subtarea
  async addSubtask(taskId, userId, subtaskData) {
    return new Promise((resolve, reject) => {
      const subtaskId = uuidv4();
      const query = `
        INSERT INTO task_subtasks (id, task_id, user_id, text, order_index)
        VALUES (?, ?, ?, ?, ?)
      `;

      console.log(`📝 [DB] addSubtask llamada con:`, { taskId, userId, subtaskData, subtaskId });

      this.db.run(query, [
        subtaskId,
        taskId,
        userId,
        subtaskData.text,
        subtaskData.order_index || 0
      ], function(err) {
        if (err) {
          console.error(`❌ [DB] Error en addSubtask:`, err);
          reject(err);
          return;
        }
        console.log(`✅ [DB] Subtarea insertada exitosamente:`, { subtaskId, changes: this.changes });
        resolve({ success: true, id: subtaskId });
      });
    });
  }

  // Actualizar subtarea
  async updateSubtask(subtaskId, userId, updates) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE task_subtasks
        SET text = ?, completed = ?
        WHERE id = ? AND user_id = ?
      `;

      this.db.run(query, [
        updates.text,
        updates.completed ? 1 : 0,
        subtaskId,
        userId
      ], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  // Eliminar subtarea
  async deleteSubtask(subtaskId, userId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM task_subtasks WHERE id = ? AND user_id = ?`;

      this.db.run(query, [subtaskId, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  // Agregar archivo adjunto
  async addAttachment(taskId, userId, attachmentData) {
    return new Promise((resolve, reject) => {
      const attachmentId = uuidv4();

      console.log(`📎 [DB] addAttachment llamada:`, {
        attachmentId,
        taskId,
        userId,
        filename: attachmentData.filename,
        original_name: attachmentData.original_name,
        file_size: attachmentData.file_size,
        mime_type: attachmentData.mime_type,
        is_image: attachmentData.is_image
      });

      const query = `
        INSERT INTO task_attachments (id, task_id, user_id, filename, original_name, file_path, file_size, mime_type, is_image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        attachmentId,
        taskId,
        userId,
        attachmentData.filename,
        attachmentData.original_name,
        attachmentData.file_path,
        attachmentData.file_size || 0,
        attachmentData.mime_type || '',
        attachmentData.is_image ? 1 : 0
      ];

      console.log(`📎 [DB] Ejecutando query addAttachment:`, query);
      console.log(`📎 [DB] Valores:`, values);

      this.db.run(query, values, function(err) {
        if (err) {
          console.error(`❌ [DB] Error en addAttachment:`, err);
          reject(err);
          return;
        }

        console.log(`✅ [DB] Attachment agregado exitosamente:`, {
          attachmentId,
          changes: this.changes,
          lastID: this.lastID
        });

        resolve({ success: true, id: attachmentId });
      });
    });
  }

  // Eliminar archivo adjunto
  async deleteAttachment(attachmentId, userId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM task_attachments WHERE id = ? AND user_id = ?`;

      this.db.run(query, [attachmentId, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  // ===================== FIN MÉTODOS PARA CONTENIDO DETALLADO =====================

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