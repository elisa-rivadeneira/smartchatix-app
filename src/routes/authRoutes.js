const express = require('express');
const UserDatabase = require('../database/userDatabase');

const router = express.Router();
const userDB = new UserDatabase();

// Middleware para verificar autenticación
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const user = await userDB.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
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
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    const result = await userDB.loginUser(email, password);

    res.json({
      success: true,
      message: 'Login exitoso',
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt
    });

  } catch (error) {
    console.error('Error en login:', error);
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

module.exports = { router, authenticateToken, userDB };