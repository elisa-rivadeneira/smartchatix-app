const express = require('express');
const UserDatabase = require('../database/userDatabase');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const userDB = new UserDatabase();

// Función para guardar logs de autenticación
const logAuth = (level, message, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details
  };

  const logFile = path.join(__dirname, '../../auth_logs.json');
  let logs = [];

  try {
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error leyendo auth_logs.json:', error);
  }

  logs.push(logEntry);

  // Mantener solo los últimos 100 logs
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }

  try {
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error escribiendo auth_logs.json:', error);
  }
};

// Middleware para verificar autenticación
const authenticateToken = async (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔐 [${timestamp}] Verificando autenticación para: ${req.url}`);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log(`🔑 Auth header: ${authHeader ? 'PRESENTE' : 'AUSENTE'}`);
  console.log(`🎫 Token: ${token ? `${token.substring(0, 20)}...` : 'NO ENCONTRADO'}`);

  if (!token) {
    console.log(`❌ Sin token - respondiendo 401`);
    logAuth('WARNING', 'Intento de acceso sin token', {
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const user = await userDB.verifyToken(token);
    console.log(`✅ Token válido para usuario: ${user.email}`);
    req.user = user;
    next();
  } catch (error) {
    console.log(`❌ Error verificando token: ${error.message}`);
    logAuth('ERROR', 'Error verificando token', {
      error: error.message,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      token: token ? token.substring(0, 20) + '...' : 'none'
    });
    return res.status(403).json({ error: error.message });
  }
};

// Rutas públicas de autenticación
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, contraseña y nombre son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    const user = await userDB.registerUser(email, password, name);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(400).json({
      error: error.message || 'Error al registrar usuario'
    });
  }
});

router.post('/login', async (req, res) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  console.log(`\n🔑 [${timestamp}] INTENTO DE LOGIN`);
  console.log(`📱 Cliente: ${isMobile ? 'MÓVIL' : 'DESKTOP'}`);
  console.log(`🌐 IP: ${req.ip}`);
  console.log(`📧 Email recibido: ${req.body.email || 'NO RECIBIDO'}`);
  console.log(`🔒 Password recibido: ${req.body.password ? 'SÍ' : 'NO'}`);
  console.log(`📦 Body completo: ${JSON.stringify(req.body, null, 2)}`);

  // Log del intento
  logAuth('INFO', 'Intento de login', {
    email: req.body.email,
    isMobile,
    ip: req.ip,
    userAgent,
    hasPassword: !!req.body.password,
    timestamp
  });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log(`❌ Faltan credenciales - email: ${!!email}, password: ${!!password}`);
      logAuth('WARNING', 'Login fallido - credenciales incompletas', {
        email: email || 'missing',
        hasEmail: !!email,
        hasPassword: !!password,
        ip: req.ip,
        isMobile
      });
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    console.log(`🔍 Intentando autenticar usuario: ${email}`);
    const result = await userDB.loginUser(email, password);
    console.log(`✅ Login exitoso para: ${email}`);
    console.log(`🎫 Token generado: ${result.token.substring(0, 20)}...`);

    // Log del login exitoso
    logAuth('SUCCESS', 'Login exitoso', {
      email,
      userId: result.user.id,
      isMobile,
      ip: req.ip,
      userAgent,
      tokenPrefix: result.token.substring(0, 20) + '...'
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt
    });

  } catch (error) {
    console.log(`❌ Error en login: ${error.message}`);
    console.log(`🔍 Stack trace: ${error.stack}`);

    // Log del error de login
    logAuth('ERROR', 'Login fallido', {
      email: req.body.email,
      error: error.message,
      stack: error.stack,
      isMobile,
      ip: req.ip,
      userAgent
    });

    res.status(401).json({
      error: error.message || 'Credenciales inválidas'
    });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    await userDB.logoutUser(token);

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error al cerrar sesión'
    });
  }
});

// Verificar token (para mantener sesión)
router.get('/verify', authenticateToken, (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n✅ [${timestamp}] TOKEN VERIFICADO - Usuario: ${req.user.email}`);

  res.json({
    success: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar
    }
  });
});

// Rutas protegidas para datos de usuario
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const config = await userDB.getUserAssistantConfig(req.user.userId);
    const projects = await userDB.getUserProjects(req.user.userId);
    const dailyTasks = await userDB.getUserDailyTasks(req.user.userId);

    res.json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar
      },
      assistantConfig: config,
      projects,
      dailyTasks
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error al obtener datos del perfil'
    });
  }
});

// Actualizar configuración del asistente
router.put('/assistant-config', authenticateToken, async (req, res) => {
  try {
    const { config } = req.body;
    const userId = req.user.userId;

    const query = `
      UPDATE user_assistant_config SET
        base_prompt = ?,
        system_prompt = ?,
        user_name = ?,
        assistant_name = ?,
        specialties = ?,
        tone = ?,
        focus_areas = ?,
        memory = ?,
        voice_enabled = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;

    userDB.db.run(query, [
      config.basePrompt,
      config.systemPrompt,
      config.userName,
      config.assistantName,
      JSON.stringify(config.specialties),
      config.tone,
      JSON.stringify(config.focusAreas),
      JSON.stringify(config.memory),
      config.voiceEnabled ? 1 : 0,
      userId
    ], function(err) {
      if (err) {
        console.error('Error actualizando configuración:', err);
        return res.status(500).json({ error: 'Error al actualizar configuración' });
      }

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente'
      });
    });

  } catch (error) {
    console.error('Error en actualización de configuración:', error);
    res.status(500).json({
      error: 'Error al actualizar configuración'
    });
  }
});

// Guardar proyecto
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { project } = req.body;
    const userId = req.user.userId;
    const projectId = require('crypto').randomUUID();

    const query = `
      INSERT INTO user_projects (
        id, user_id, title, description, priority, status, progress, deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    userDB.db.run(query, [
      projectId,
      userId,
      project.title,
      project.description || '',
      project.priority || 'media',
      project.status || 'activo',
      project.progress || 0,
      project.deadline || null
    ], function(err) {
      if (err) {
        console.error('Error guardando proyecto:', err);
        return res.status(500).json({ error: 'Error al guardar proyecto' });
      }

      res.json({
        success: true,
        project: {
          id: projectId,
          ...project,
          user_id: userId,
          tasks: []
        }
      });
    });

  } catch (error) {
    console.error('Error en creación de proyecto:', error);
    res.status(500).json({
      error: 'Error al crear proyecto'
    });
  }
});

// Guardar tarea diaria
router.post('/daily-tasks', authenticateToken, async (req, res) => {
  try {
    const { task } = req.body;
    const userId = req.user.userId;
    const taskId = require('crypto').randomUUID();

    const query = `
      INSERT INTO daily_tasks (
        id, user_id, text, completed, project_id, project_task_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    userDB.db.run(query, [
      taskId,
      userId,
      task.text,
      task.completed ? 1 : 0,
      task.projectId || null,
      task.projectTaskId || null
    ], function(err) {
      if (err) {
        console.error('Error guardando tarea diaria:', err);
        return res.status(500).json({ error: 'Error al guardar tarea' });
      }

      res.json({
        success: true,
        task: {
          id: taskId,
          ...task,
          user_id: userId
        }
      });
    });

  } catch (error) {
    console.error('Error en creación de tarea:', error);
    res.status(500).json({
      error: 'Error al crear tarea'
    });
  }
});

// Eliminar tarea diaria
router.delete('/daily-tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;

    // Verificar que la tarea pertenece al usuario
    const taskQuery = 'SELECT * FROM daily_tasks WHERE id = ? AND user_id = ?';
    userDB.db.get(taskQuery, [taskId, userId], (err, task) => {
      if (err) {
        console.error('Error verificando tarea diaria:', err);
        return res.status(500).json({ error: 'Error al verificar tarea' });
      }

      if (!task) {
        return res.status(404).json({ error: 'Tarea diaria no encontrada' });
      }

      // Eliminar la tarea
      const deleteQuery = 'DELETE FROM daily_tasks WHERE id = ? AND user_id = ?';
      userDB.db.run(deleteQuery, [taskId, userId], function(deleteErr) {
        if (deleteErr) {
          console.error('Error eliminando tarea diaria:', deleteErr);
          return res.status(500).json({ error: 'Error al eliminar tarea' });
        }

        res.json({
          success: true,
          message: 'Tarea diaria eliminada exitosamente'
        });
      });
    });

  } catch (error) {
    console.error('Error en eliminación de tarea diaria:', error);
    res.status(500).json({
      error: 'Error al eliminar tarea diaria'
    });
  }
});

// Guardar tarea de proyecto
router.post('/project-tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId, task } = req.body;
    const userId = req.user.userId;
    const taskId = require('crypto').randomUUID();

    // Verificar que el proyecto pertenece al usuario
    const projectQuery = 'SELECT id FROM user_projects WHERE id = ? AND user_id = ?';
    userDB.db.get(projectQuery, [projectId, userId], (err, project) => {
      if (err || !project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      const query = `
        INSERT INTO project_tasks (
          id, project_id, user_id, title, description, completed, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      userDB.db.run(query, [
        taskId,
        projectId,
        userId,
        task.title,
        task.description || '',
        task.completed ? 1 : 0,
        task.progress || 0
      ], function(insertErr) {
        if (insertErr) {
          console.error('Error guardando tarea:', insertErr);
          return res.status(500).json({ error: 'Error al guardar tarea' });
        }

        res.json({
          success: true,
          task: {
            id: taskId,
            ...task,
            project_id: projectId,
            user_id: userId
          }
        });
      });
    });

  } catch (error) {
    console.error('Error en creación de tarea:', error);
    res.status(500).json({
      error: 'Error al crear tarea'
    });
  }
});

// Actualizar proyecto
router.put('/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { project } = req.body;
    const userId = req.user.userId;

    // Verificar que el proyecto pertenece al usuario
    const projectQuery = 'SELECT * FROM user_projects WHERE id = ? AND user_id = ?';
    userDB.db.get(projectQuery, [projectId, userId], (err, existingProject) => {
      if (err) {
        console.error('Error verificando proyecto:', err);
        return res.status(500).json({ error: 'Error al verificar proyecto' });
      }

      if (!existingProject) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      // Actualizar el proyecto
      const updateQuery = `
        UPDATE user_projects
        SET title = ?, description = ?, priority = ?, status = ?, progress = ?, deadline = ?
        WHERE id = ? AND user_id = ?
      `;

      userDB.db.run(updateQuery, [
        project.title || existingProject.title,
        project.description !== undefined ? project.description : existingProject.description,
        project.priority || existingProject.priority,
        project.status || existingProject.status,
        project.progress !== undefined ? project.progress : existingProject.progress,
        project.deadline !== undefined ? project.deadline : existingProject.deadline,
        projectId,
        userId
      ], function(updateErr) {
        if (updateErr) {
          console.error('Error actualizando proyecto:', updateErr);
          return res.status(500).json({ error: 'Error al actualizar proyecto' });
        }

        res.json({
          success: true,
          message: 'Proyecto actualizado exitosamente'
        });
      });
    });

  } catch (error) {
    console.error('Error en actualización de proyecto:', error);
    res.status(500).json({
      error: 'Error al actualizar proyecto'
    });
  }
});

// Eliminar proyecto
router.delete('/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Verificar que el proyecto pertenece al usuario
    const projectQuery = 'SELECT * FROM user_projects WHERE id = ? AND user_id = ?';
    userDB.db.get(projectQuery, [projectId, userId], (err, existingProject) => {
      if (err) {
        console.error('Error verificando proyecto:', err);
        return res.status(500).json({ error: 'Error al verificar proyecto' });
      }

      if (!existingProject) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      // Primero eliminar todas las tareas del proyecto
      const deleteTasksQuery = 'DELETE FROM project_tasks WHERE project_id = ? AND user_id = ?';
      userDB.db.run(deleteTasksQuery, [projectId, userId], function(deleteTasksErr) {
        if (deleteTasksErr) {
          console.error('Error eliminando tareas del proyecto:', deleteTasksErr);
          return res.status(500).json({ error: 'Error al eliminar tareas del proyecto' });
        }

        // Luego eliminar el proyecto
        const deleteProjectQuery = 'DELETE FROM user_projects WHERE id = ? AND user_id = ?';
        userDB.db.run(deleteProjectQuery, [projectId, userId], function(deleteProjectErr) {
          if (deleteProjectErr) {
            console.error('Error eliminando proyecto:', deleteProjectErr);
            return res.status(500).json({ error: 'Error al eliminar proyecto' });
          }

          res.json({
            success: true,
            message: 'Proyecto eliminado exitosamente'
          });
        });
      });
    });

  } catch (error) {
    console.error('Error en eliminación de proyecto:', error);
    res.status(500).json({
      error: 'Error al eliminar proyecto'
    });
  }
});

// Eliminar tarea de proyecto
router.delete('/project-tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;

    // Verificar que la tarea pertenece al usuario
    const taskQuery = 'SELECT * FROM project_tasks WHERE id = ? AND user_id = ?';
    userDB.db.get(taskQuery, [taskId, userId], (err, task) => {
      if (err) {
        console.error('Error verificando tarea:', err);
        return res.status(500).json({ error: 'Error al verificar tarea' });
      }

      if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      // Eliminar la tarea
      const deleteQuery = 'DELETE FROM project_tasks WHERE id = ? AND user_id = ?';
      userDB.db.run(deleteQuery, [taskId, userId], function(deleteErr) {
        if (deleteErr) {
          console.error('Error eliminando tarea:', deleteErr);
          return res.status(500).json({ error: 'Error al eliminar tarea' });
        }

        res.json({
          success: true,
          message: 'Tarea eliminada exitosamente'
        });
      });
    });

  } catch (error) {
    console.error('Error en eliminación de tarea:', error);
    res.status(500).json({
      error: 'Error al eliminar tarea'
    });
  }
});

// Cambiar contraseña del usuario
router.put('/change-password', (req, res, next) => {
  console.log('🔐 [CHANGE-PASSWORD] Ruta alcanzada, ejecutando middleware...');
  authenticateToken(req, res, next);
}, async (req, res) => {
  console.log('🔐 [CHANGE-PASSWORD] Iniciando cambio de contraseña');
  console.log('📦 Body recibido:', req.body);
  console.log('👤 Usuario autenticado:', req.user);

  try {
    const { newPassword } = req.body;
    const userId = req.user.userId;

    // Validar nueva contraseña
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Cambiar contraseña en la base de datos
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const query = `UPDATE users SET password = ? WHERE id = ?`;

    userDB.db.run(query, [hashedPassword, userId], function(err) {
      if (err) {
        console.error('Error actualizando contraseña:', err);
        return res.status(500).json({ error: 'Error al actualizar contraseña' });
      }

      console.log(`✅ Contraseña actualizada para usuario: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    });

  } catch (error) {
    console.error('Error en cambio de contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña'
    });
  }
});

// Guardar mensaje de chat
router.post('/chat-messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;
    const messageId = require('crypto').randomUUID();

    const query = `
      INSERT INTO chat_messages (
        id, user_id, type, content, function_results
      ) VALUES (?, ?, ?, ?, ?)
    `;

    userDB.db.run(query, [
      messageId,
      userId,
      message.type,
      message.content,
      JSON.stringify(message.functionResults || [])
    ], function(err) {
      if (err) {
        console.error('Error guardando mensaje:', err);
        return res.status(500).json({ error: 'Error al guardar mensaje' });
      }

      res.json({
        success: true,
        message: {
          id: messageId,
          ...message,
          user_id: userId
        }
      });
    });

  } catch (error) {
    console.error('Error en guardar mensaje:', error);
    res.status(500).json({
      error: 'Error al guardar mensaje'
    });
  }
});

// === RUTAS PARA SISTEMA DE MEMORIA CONVERSACIONAL ===

// Ruta para guardar insights
router.post('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, insight_type, content, context, importance_level } = req.body;

    userDB.db.run(
      `INSERT INTO assistant_insights (id, user_id, insight_type, content, context, importance_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, insight_type, content, context, importance_level],
      function(err) {
        if (err) {
          console.error('Error guardando insight:', err);
          return res.status(500).json({ error: 'Error al guardar insight' });
        }
        res.json({ success: true, message: 'Insight guardado exitosamente' });
      }
    );
  } catch (error) {
    console.error('Error en guardar insight:', error);
    res.status(500).json({ error: 'Error al guardar insight' });
  }
});

// Ruta para obtener insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    userDB.db.all(
      `SELECT * FROM assistant_insights WHERE user_id = ? ORDER BY importance_level DESC, created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Error obteniendo insights:', err);
          return res.status(500).json({ error: 'Error al obtener insights' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error en obtener insights:', error);
    res.status(500).json({ error: 'Error al obtener insights' });
  }
});

// Ruta para guardar compromisos
router.post('/commitments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, commitment, deadline } = req.body;

    userDB.db.run(
      `INSERT INTO user_commitments (id, user_id, commitment, deadline) VALUES (?, ?, ?, ?)`,
      [id, userId, commitment, deadline],
      function(err) {
        if (err) {
          console.error('Error guardando compromiso:', err);
          return res.status(500).json({ error: 'Error al guardar compromiso' });
        }
        res.json({ success: true, message: 'Compromiso guardado exitosamente' });
      }
    );
  } catch (error) {
    console.error('Error en guardar compromiso:', error);
    res.status(500).json({ error: 'Error al guardar compromiso' });
  }
});

// Ruta para obtener compromisos
router.get('/commitments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    userDB.db.all(
      `SELECT * FROM user_commitments WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Error obteniendo compromisos:', err);
          return res.status(500).json({ error: 'Error al obtener compromisos' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error en obtener compromisos:', error);
    res.status(500).json({ error: 'Error al obtener compromisos' });
  }
});

// Ruta para guardar logros
router.post('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, achievement, achievement_type, related_project_id, celebration_level } = req.body;

    userDB.db.run(
      `INSERT INTO user_achievements (id, user_id, achievement, achievement_type, related_project_id, celebration_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, achievement, achievement_type, related_project_id, celebration_level],
      function(err) {
        if (err) {
          console.error('Error guardando logro:', err);
          return res.status(500).json({ error: 'Error al guardar logro' });
        }
        res.json({ success: true, message: 'Logro guardado exitosamente' });
      }
    );
  } catch (error) {
    console.error('Error en guardar logro:', error);
    res.status(500).json({ error: 'Error al guardar logro' });
  }
});

// Ruta para obtener logros
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    userDB.db.all(
      `SELECT * FROM user_achievements WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Error obteniendo logros:', err);
          return res.status(500).json({ error: 'Error al obtener logros' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error en obtener logros:', error);
    res.status(500).json({ error: 'Error al obtener logros' });
  }
});

module.exports = { router, authenticateToken, userDB };