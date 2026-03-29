require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AssistantManager = require('./src/assistantManager');
const UserDatabase = require('./src/database/userDatabase');
const { router: authRoutes, authenticateToken, requirePremium } = require('./src/routes/authRoutes');
const DatabaseBackupSystem = require('./backup_system');
const DatabaseMigrations = require('./src/database/migrations');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Verificar volumen persistente ANTES de inicializar base de datos
console.log('🔍 Verificando volumen persistente...');
const { execSync } = require('child_process');
try {
  execSync('node scripts/ensure_volume.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error verificando volumen:', error.message);
}

// Initialize assistant and database
const assistant = new AssistantManager();
const userDB = new UserDatabase();
const backupSystem = new DatabaseBackupSystem();
let assistantContext = null;

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  console.log(`\n🌐 [${timestamp}] ${req.method} ${req.url}`);
  console.log(`📱 Cliente: ${isMobile ? 'MÓVIL' : 'DESKTOP'} - ${userAgent.substring(0, 100)}`);
  console.log(`🔗 IP: ${req.ip}`);

  // Log especial para uploads
  if (req.url.includes('/attachments') || req.url.includes('/upload')) {
    console.log(`🔥 UPLOAD REQUEST DETECTED: ${req.method} ${req.url}`);
    console.log(`🔥 Content-Type: ${req.headers['content-type']}`);
    console.log(`🔥 Authorization: ${req.headers['authorization'] ? 'PRESENT' : 'MISSING'}`);
  }

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body: ${JSON.stringify(req.body, null, 2)}`);
  }

  // Log de la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = new Date().toISOString();
    console.log(`📤 [${responseTime}] Respuesta ${res.statusCode}: ${typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200)}`);
    originalSend.call(this, data);
  };

  next();
});

// Configuración CORS mejorada con logging
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🔗 CORS: Request from origin: ${origin || 'no-origin'}`);

    // Permitir requests sin origin (apps móviles, postman, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request without origin');
      return callback(null, true);
    }

    // Permitir localhost y cualquier dominio para desarrollo/producción
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://app.smartchatix.com',
      /^http:\/\/192\.168\.\d+\.\d+:3001$/  // IPs locales
    ];

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else {
        return allowedOrigin.test(origin);
      }
    });

    if (isAllowed) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin not allowed');
      callback(null, true); // Permitir de todos modos para debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
// Middleware JSON condicional - no procesar FormData
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';

  // Solo aplicar parsing JSON si NO es multipart/form-data
  if (contentType.includes('application/json')) {
    return express.json()(req, res, next);
  }

  next();
});

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_session_secret_super_seguro_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // En producción cambiar a true con HTTPS
}));

// Configuración de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurar estrategia de Google OAuth
const callbackURL = process.env.GOOGLE_CALLBACK_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://app.smartchatix.com/auth/google/callback'
    : '/auth/google/callback');

// Verificar que las variables de Google OAuth estén configuradas
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.log('⚠️  Google OAuth credentials not configured. Google login will be disabled.');
  console.log('   Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables to enable Google login.');
} else {
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔑 Google OAuth Strategy - Profile received:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      const email = profile.emails[0].value;
      const name = profile.displayName;
      const googleId = profile.id;
      const picture = profile.photos[0]?.value;

      // Buscar o crear usuario en la base de datos
      const findUserQuery = 'SELECT * FROM users WHERE email = ? OR google_id = ?';

      return new Promise((resolve, reject) => {
        userDB.db.get(findUserQuery, [email, googleId], (err, existingUser) => {
          if (err) {
            console.error('❌ Google OAuth Strategy - Error buscando usuario:', err);
            return reject(err);
          }

          if (existingUser) {
            // Usuario existe, actualizar datos si es necesario
            console.log('👤 Google OAuth Strategy - Usuario existente encontrado:', existingUser.id);

            const updateQuery = 'UPDATE users SET name = ?, google_id = ?, picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            userDB.db.run(updateQuery, [name, googleId, picture, existingUser.id], (updateErr) => {
              if (updateErr) {
                console.error('❌ Google OAuth Strategy - Error actualizando usuario:', updateErr);
                return reject(updateErr);
              }

              const user = {
                id: existingUser.id,
                email: existingUser.email,
                name: name,
                picture: picture,
                googleId: googleId,
                subscription_type: existingUser.subscription_type || 'free'
              };

              console.log('✅ Google OAuth Strategy - Usuario existente actualizado:', user);
              resolve(done(null, user));
            });
          } else {
            // Crear nuevo usuario
            const userId = crypto.randomUUID();
            const createUserQuery = `
              INSERT INTO users (id, email, name, google_id, picture, subscription_type, created_at)
              VALUES (?, ?, ?, ?, ?, 'free', CURRENT_TIMESTAMP)
            `;

            userDB.db.run(createUserQuery, [userId, email, name, googleId, picture], function(createErr) {
              if (createErr) {
                console.error('❌ Google OAuth Strategy - Error creando usuario:', createErr);
                return reject(createErr);
              }

              const user = {
                id: userId,
                email: email,
                name: name,
                picture: picture,
                googleId: googleId,
                subscription_type: 'free'
              };

              console.log('✅ Google OAuth Strategy - Nuevo usuario creado:', user);
              resolve(done(null, user));
            });
          }
        });
      });

    } catch (error) {
      console.error('❌ Google OAuth Strategy - Error general:', error);
      return done(error, null);
    }
  }));
}

// Serialización de usuario para sesiones
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Serve attachments BEFORE static files
app.use('/uploads', (req, res, next) => {
  console.log(`🎯 UPLOADS REQUEST: ${req.path}`);
  express.static(path.join(__dirname, 'uploads/tasks'))(req, res, next);
});

// Serve attachments with /api prefix (para compatibilidad con frontend)
app.use('/api/uploads', (req, res, next) => {
  console.log(`🎯 API UPLOADS REQUEST: ${req.path}`);
  express.static(path.join(__dirname, 'uploads/tasks'))(req, res, next);
});

app.use(express.static('dist'));

// Google OAuth routes (solo si las credenciales están configuradas)
if (googleClientId && googleClientSecret) {
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      console.log('🌐 Google OAuth Callback - Request received');
      console.log('👤 User authenticated:', req.user);
      try {
        // Generar token JWT para el usuario de Google
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro_aqui';

        const token = jwt.sign(
          {
            id: req.user.id,
            email: req.user.email,
            googleId: req.user.googleId,
            provider: 'google'
          },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        // Determinar URL del frontend
        const frontendUrl = process.env.FRONTEND_URL ||
          (process.env.NODE_ENV === 'production'
            ? 'https://app.smartchatix.com'
            : 'http://localhost:5173');

        // Redireccionar al frontend con éxito y token
        res.redirect(`${frontendUrl}/?login=success&user=${encodeURIComponent(JSON.stringify(req.user))}&token=${encodeURIComponent(token)}`);
      } catch (error) {
        console.error('Error generating token for Google user:', error);
        const frontendUrl = process.env.FRONTEND_URL ||
          (process.env.NODE_ENV === 'production'
            ? 'https://app.smartchatix.com'
            : 'http://localhost:5173');
        res.redirect(`${frontendUrl}/?error=auth_failed`);
      }
    }
  );
} else {
  // Rutas de fallback cuando Google OAuth no está configurado
  app.get('/auth/google', (req, res) => {
    res.status(503).json({
      error: 'Google OAuth not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
    });
  });

  app.get('/auth/google/callback', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://app.smartchatix.com'
        : 'http://localhost:5173');
    res.redirect(`${frontendUrl}/?error=oauth_not_configured`);
  });
}

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.redirect('/');
  });
});

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Test endpoint para verificar conectividad
app.get('/api/test-upload-connectivity', (req, res) => {
  console.log('🧪 TEST ENDPOINT CALLED - Server is receiving requests');
  res.json({
    success: true,
    message: 'Upload connectivity test successful',
    timestamp: new Date().toISOString()
  });
});

// Configurar multer para compatibilidad con frontend (upload.php)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads/tasks');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB límite
  },
  fileFilter: function (req, file, cb) {
    console.log(`📎 [MULTER-FILTER] Archivo recibido: ${file.originalname}`);
    console.log(`📎 [MULTER-FILTER] Tipo MIME: ${file.mimetype}`);
    console.log(`📎 [MULTER-FILTER] Fieldname: ${file.fieldname}`);

    // Lista expandida de tipos de archivo permitidos
    const allowedMimes = [
      // Imágenes
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      // Documentos
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archivos comprimidos
      'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
      // Otros comunes
      'application/json', 'application/xml', 'text/xml',
      // Tipos genéricos para archivos sin extensión
      'application/octet-stream'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      console.log(`✅ [MULTER-FILTER] Archivo aceptado: ${file.originalname}`);
      cb(null, true);
    } else {
      console.log(`❌ [MULTER-FILTER] Archivo rechazado: ${file.originalname} (tipo: ${file.mimetype})`);
      console.log(`💡 [MULTER-FILTER] Tipos permitidos:`, allowedMimes);
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  }
});

// Endpoint compatible con frontend: /upload.php
app.post('/upload.php', upload.array('files'), (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se subieron archivos'
      });
    }

    // Respuesta compatible con el frontend
    const fileData = files.map(file => ({
      file: {
        filename: file.filename,
        original_name: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }
    }));

    res.json({
      success: true,
      message: 'Archivos subidos exitosamente',
      files: fileData
    });

  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir archivos: ' + error.message
    });
  }
});

// Endpoint compatible con frontend: /api/upload.php (para copiar/pegar)
app.post('/api/upload.php', upload.array('files'), (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se subieron archivos'
      });
    }

    // Respuesta compatible con el frontend
    const fileData = files.map(file => ({
      file: {
        filename: file.filename,
        original_name: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }
    }));

    res.json({
      success: true,
      message: 'Archivos subidos exitosamente',
      files: fileData
    });

  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir archivos: ' + error.message
    });
  }
});

// Initialize assistant on server start
const initializeAssistant = async () => {
  try {
    assistantContext = assistant.initialize();
    console.log('✅ Asistente inicializado en servidor');
  } catch (error) {
    console.error('❌ Error inicializando asistente:', error);
  }
};

// API Routes (protegidas por autenticación)
app.get('/api/assistant/status', authenticateToken, requirePremium, (req, res) => {
  const context = assistant.getDailyContext();
  res.json({
    active: assistant.isActive,
    context: context,
    sessionStartTime: assistant.sessionStartTime
  });
});

app.get('/api/assistant/context', authenticateToken, requirePremium, (req, res) => {
  const context = assistant.getDailyContext();
  res.json(context);
});

app.post('/api/assistant/message', authenticateToken, requirePremium, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = assistant.processUserMessage(message);
    const context = assistant.getDailyContext();

    res.json({
      processed: result.processed,
      contextUpdated: result.contextUpdated,
      timestamp: result.timestamp,
      context: context
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Error processing message' });
  }
});

app.post('/api/assistant/response', authenticateToken, requirePremium, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await assistant.sendAssistantMessage(message);
    res.json(result);
  } catch (error) {
    console.error('Error sending assistant message:', error);
    res.status(500).json({ error: 'Error sending assistant message' });
  }
});

app.post('/api/assistant/project', authenticateToken, async (req, res) => {
  const projectData = req.body;

  try {
    // Guardar en la base de datos SQLite
    const project = await userDB.createProject(req.user.userId, projectData);

    // Opcionalmente, también guardar en el UserMemory para compatibilidad
    assistant.addProject(projectData);

    res.json(project);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Error adding project' });
  }
});

app.put('/api/assistant/project/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const updates = req.body;

  try {
    const project = assistant.updateProject(projectId, updates);
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error updating project' });
  }
});

app.post('/api/assistant/priority', authenticateToken, (req, res) => {
  const priorityData = req.body;

  try {
    const priorities = assistant.addPriority(priorityData);
    res.json(priorities);
  } catch (error) {
    console.error('Error adding priority:', error);
    res.status(500).json({ error: 'Error adding priority' });
  }
});

app.post('/api/assistant/user', authenticateToken, (req, res) => {
  const profileData = req.body;

  try {
    const user = assistant.updateUserProfile(profileData);
    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error updating user profile' });
  }
});

app.get('/api/assistant/chat-history', authenticateToken, requirePremium, (req, res) => {
  try {
    const chatHistory = assistant.getChatHistory();
    res.json(chatHistory);
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Error getting chat history' });
  }
});

app.get('/api/assistant/summary', authenticateToken, requirePremium, (req, res) => {
  try {
    const summary = assistant.generateDailySummary();
    res.json(summary);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Error generating summary' });
  }
});

app.post('/api/assistant/morning-greeting', authenticateToken, requirePremium, (req, res) => {
  try {
    assistant.triggerMorningGreeting();
    res.json({ message: 'Morning greeting triggered' });
  } catch (error) {
    console.error('Error triggering morning greeting:', error);
    res.status(500).json({ error: 'Error triggering morning greeting' });
  }
});

app.put('/api/assistant/task/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { completed } = req.body;

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'El campo completed debe ser un boolean' });
  }

  try {
    const result = await userDB.updateDailyTaskCompletion(req.user.userId, taskId, completed);
    res.json(result);
  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({ error: 'Error actualizando estado de tarea' });
  }
});

app.delete('/api/assistant/task/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await userDB.deleteDailyTask(req.user.userId, taskId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Error eliminando tarea' });
  }
});

// Endpoint para archivar tarea (LIBRE para todos los usuarios)
app.put('/api/assistant/task/:taskId/archive', authenticateToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    console.log(`📦 [ARCHIVE-TASK] Archivando tarea: ${taskId} para usuario: ${req.user.userId}`);
    const result = await userDB.archiveDailyTask(req.user.userId, taskId);
    console.log(`✅ [ARCHIVE-TASK] Resultado:`, result);
    res.json(result);
  } catch (error) {
    console.error('❌ [ARCHIVE-TASK] Error archivando tarea:', error);
    res.status(500).json({ error: 'Error archivando tarea' });
  }
});

// Endpoint para desarchivar tarea (LIBRE para todos los usuarios)
app.put('/api/assistant/task/:taskId/unarchive', authenticateToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    console.log(`📦 [UNARCHIVE-TASK] Desarchivando tarea: ${taskId} para usuario: ${req.user.userId}`);
    const result = await userDB.unarchiveDailyTask(req.user.userId, taskId);
    console.log(`✅ [UNARCHIVE-TASK] Resultado:`, result);
    res.json(result);
  } catch (error) {
    console.error('❌ [UNARCHIVE-TASK] Error desarchivando tarea:', error);
    res.status(500).json({ error: 'Error desarchivando tarea' });
  }
});

// Endpoint para obtener tareas archivadas
app.get('/api/assistant/archived-tasks', authenticateToken, async (req, res) => {
  try {
    console.log(`📋 [ARCHIVED-TASKS] Obteniendo tareas archivadas para usuario: ${req.user.userId}`);
    const archivedTasks = await userDB.getUserArchivedTasks(req.user.userId);
    res.json(archivedTasks);
  } catch (error) {
    console.error('❌ [ARCHIVED-TASKS] Error fetching archived tasks:', error);
    res.status(500).json({ error: 'Error al obtener tareas archivadas' });
  }
});

app.post('/api/daily-tasks', authenticateToken, async (req, res) => {
  try {
    const { task } = req.body;

    if (!task || !task.text) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const newTask = await userDB.createDailyTask(req.user.userId, {
      text: task.text,
      completed: task.completed || false,
      projectId: task.projectId || null,
      projectTaskId: task.projectTaskId || null
    });

    res.json(newTask);
  } catch (error) {
    console.error('Error creating daily task:', error);
    res.status(500).json({ error: 'Error creating daily task' });
  }
});

// Actualizar tarea diaria
app.put('/api/daily-tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 [UPDATE DAILY-TASK] Nueva petición recibida:', {
      taskId: req.params.taskId,
      updates: req.body,
      userId: req.user.userId,
      timestamp: new Date().toISOString()
    });

    const { taskId } = req.params;
    const { text, completed, projectId, projectTaskId, progress } = req.body;
    const userId = req.user.userId;

    // Verificar que la tarea pertenece al usuario
    const taskQuery = 'SELECT * FROM daily_tasks WHERE id = ? AND user_id = ?';
    console.log('🔍 [UPDATE DAILY-TASK] Verificando tarea:', { taskId, userId });

    userDB.db.get(taskQuery, [taskId, userId], (err, task) => {
      if (err) {
        console.error('❌ [UPDATE DAILY-TASK] Error en consulta de tarea:', err);
        return res.status(500).json({ error: 'Error al verificar tarea' });
      }

      if (!task) {
        console.log('⚠️ [UPDATE DAILY-TASK] Tarea no encontrada:', { taskId, userId });
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      console.log('✅ [UPDATE DAILY-TASK] Tarea verificada correctamente:', task);

      // Construir la query de actualización dinámicamente
      const updates = [];
      const values = [];

      if (text !== undefined) {
        updates.push('text = ?');
        values.push(text);
      }
      if (completed !== undefined) {
        updates.push('completed = ?');
        values.push(completed ? 1 : 0);
      }
      if (projectId !== undefined) {
        updates.push('project_id = ?');
        values.push(projectId);
      }
      if (projectTaskId !== undefined) {
        updates.push('project_task_id = ?');
        values.push(projectTaskId);
      }
      if (progress !== undefined) {
        updates.push('progress = ?');
        values.push(progress);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      values.push(taskId, userId);

      const updateQuery = `
        UPDATE daily_tasks
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

      console.log('📝 [UPDATE DAILY-TASK] Ejecutando query:', updateQuery, values);

      userDB.db.run(updateQuery, values, function(updateErr) {
        if (updateErr) {
          console.error('❌ [UPDATE DAILY-TASK] Error actualizando tarea:', updateErr);
          return res.status(500).json({ error: 'Error al actualizar tarea' });
        }

        console.log('✅ [UPDATE DAILY-TASK] Tarea actualizada exitosamente:', {
          taskId,
          changes: this.changes
        });

        const responseData = {
          success: true,
          task: {
            id: taskId,
            text: text !== undefined ? text : task.text,
            completed: completed !== undefined ? completed : task.completed,
            projectId: projectId !== undefined ? projectId : task.project_id,
            projectTaskId: projectTaskId !== undefined ? projectTaskId : task.project_task_id,
            user_id: userId
          }
        };

        console.log('📤 [UPDATE DAILY-TASK] Enviando respuesta:', responseData);
        res.json(responseData);
      });
    });

  } catch (error) {
    console.error('❌ [UPDATE DAILY-TASK] Error general:', error);
    res.status(500).json({
      error: 'Error al actualizar tarea'
    });
  }
});

// Eliminar tarea diaria
app.delete('/api/daily-tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;

    console.log('🗑️ [DELETE DAILY-TASK] Petición recibida:', {
      taskId,
      userId,
      userObj: req.user,
      timestamp: new Date().toISOString()
    });

    // Verificar que la tarea pertenece al usuario
    const taskQuery = 'SELECT * FROM daily_tasks WHERE id = ? AND user_id = ?';
    console.log('🗑️ [DELETE DAILY-TASK] Ejecutando query:', taskQuery, [taskId, userId]);

    userDB.db.get(taskQuery, [taskId, userId], (err, task) => {
      if (err) {
        console.error('❌ [DELETE DAILY-TASK] Error verificando tarea diaria:', err);
        return res.status(500).json({ error: 'Error al verificar tarea' });
      }

      if (!task) {
        console.log('🗑️ [DELETE DAILY-TASK] Tarea no encontrada:', { taskId, userId });
        return res.status(404).json({ error: 'Tarea diaria no encontrada' });
      }

      console.log('🗑️ [DELETE DAILY-TASK] Tarea encontrada:', task);

      // Eliminar la tarea
      const deleteQuery = 'DELETE FROM daily_tasks WHERE id = ? AND user_id = ?';
      console.log('🗑️ [DELETE DAILY-TASK] Ejecutando eliminación:', deleteQuery, [taskId, userId]);

      userDB.db.run(deleteQuery, [taskId, userId], function(deleteErr) {
        if (deleteErr) {
          console.error('❌ [DELETE DAILY-TASK] Error eliminando tarea diaria:', deleteErr);
          return res.status(500).json({ error: 'Error al eliminar tarea' });
        }

        console.log('✅ [DELETE DAILY-TASK] Tarea eliminada exitosamente:', {
          taskId,
          changes: this.changes
        });

        res.json({
          success: true,
          message: 'Tarea diaria eliminada exitosamente'
        });
      });
    });

  } catch (error) {
    console.error('❌ [DELETE DAILY-TASK] Error general:', error);
    res.status(500).json({
      error: 'Error al eliminar tarea diaria'
    });
  }
});

// Reordenar tareas diarias
app.put('/api/daily-tasks-reorder', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 [REORDER] Petición de reordenamiento recibida:', {
      tasks: req.body.tasks,
      userId: req.user.userId,
      timestamp: new Date().toISOString()
    });

    const { tasks } = req.body;
    const userId = req.user.userId;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    // Actualizar el orden de cada tarea
    const updatePromises = tasks.map((task, index) => {
      return new Promise((resolve, reject) => {
        const query = 'UPDATE daily_tasks SET task_order = ? WHERE id = ? AND user_id = ?';
        userDB.db.run(query, [index, task.id, userId], function(err) {
          if (err) {
            console.error('❌ [REORDER] Error actualizando tarea:', task.id, err);
            reject(err);
          } else {
            console.log(`✅ [REORDER] Tarea ${task.id} actualizada a posición ${index}`);
            resolve(this.changes);
          }
        });
      });
    });

    await Promise.all(updatePromises);

    console.log('✅ [REORDER] Todas las tareas reordenadas exitosamente');
    res.json({
      success: true,
      message: 'Tareas reordenadas exitosamente'
    });

  } catch (error) {
    console.error('❌ [REORDER] Error general:', error);
    res.status(500).json({
      error: 'Error al reordenar tareas'
    });
  }
});

// Actualizar progreso de tarea diaria
app.put('/api/daily-tasks/:taskId/progress', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { progress } = req.body;
    const userId = req.user.userId;

    console.log('🔄 [PROGRESS] Actualizando progreso de tarea:', {
      taskId,
      progress,
      userId,
      timestamp: new Date().toISOString()
    });

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'El progreso debe ser un número entre 0 y 100' });
    }

    // Verificar que la tarea pertenece al usuario
    const taskQuery = 'SELECT * FROM daily_tasks WHERE id = ? AND user_id = ?';

    userDB.db.get(taskQuery, [taskId, userId], (err, task) => {
      if (err) {
        console.error('❌ [PROGRESS] Error verificando tarea:', err);
        return res.status(500).json({ error: 'Error al verificar tarea' });
      }

      if (!task) {
        console.log('⚠️ [PROGRESS] Tarea no encontrada:', { taskId, userId });
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      // Actualizar progreso y completed
      const completed = progress === 100 ? 1 : 0;
      const updateQuery = 'UPDATE daily_tasks SET progress = ?, completed = ? WHERE id = ? AND user_id = ?';

      userDB.db.run(updateQuery, [progress, completed, taskId, userId], function(updateErr) {
        if (updateErr) {
          console.error('❌ [PROGRESS] Error actualizando progreso:', updateErr);
          return res.status(500).json({ error: 'Error al actualizar progreso' });
        }

        console.log('✅ [PROGRESS] Progreso actualizado exitosamente:', {
          taskId,
          progress,
          completed,
          changes: this.changes
        });

        res.json({
          success: true,
          task: {
            id: taskId,
            progress: progress,
            completed: completed === 1
          }
        });
      });
    });

  } catch (error) {
    console.error('❌ [PROGRESS] Error general:', error);
    res.status(500).json({
      error: 'Error al actualizar progreso de tarea'
    });
  }
});

// Obtener detalles de tarea
app.get('/api/task-details/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;

    console.log('📋 [GET TASK-DETAILS] Obteniendo detalles:', { taskId, userId });

    const details = await userDB.getTaskDetails(taskId, userId);

    res.json({
      success: true,
      data: details
    });

  } catch (error) {
    console.error('❌ [GET TASK-DETAILS] Error:', error);
    res.status(500).json({
      error: 'Error al obtener detalles de la tarea'
    });
  }
});

// Guardar detalles de tarea
app.post('/api/task-details/:taskId', (req, res, next) => {
  console.log('📝 [TASK-DETAILS POST] ¡ENTRANDO AL ENDPOINT!', {
    taskId: req.params.taskId,
    method: req.method,
    body: req.body,
    authHeader: req.headers.authorization ? 'PRESENTE' : 'AUSENTE'
  });
  next();
}, authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    const { description, notes } = req.body;

    console.log('📝 [SAVE-DETAILS] Detalles de la petición:', {
      taskId,
      userId,
      userObj: req.user,
      body: req.body,
      description,
      notes,
      timestamp: new Date().toISOString()
    });

    const result = await userDB.saveTaskDetails(taskId, userId, {
      description,
      notes
    });

    console.log('✅ [SAVE-DETAILS] Resultado exitoso:', result);
    res.json(result);

  } catch (error) {
    console.error('❌ [SAVE-DETAILS] Error:', error);
    res.status(500).json({
      error: 'Error al guardar detalles de la tarea'
    });
  }
});

// Subir archivos adjuntos a tarea
app.post('/api/task-details/:taskId/attachments', authenticateToken, upload.array('files'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    const files = req.files;

    console.log(`📎 [UPLOAD-FILES] Subiendo ${files.length} archivo(s) para tarea: ${taskId}`);
    console.log(`📎 [UPLOAD-FILES] Usuario ID: ${userId}`);
    console.log(`🔧 [UPLOAD-FILES] VERSIÓN CORREGIDA - Validaciones activas`);

    // Verificar que la tarea existe y pertenece al usuario
    const taskExists = await new Promise((resolve, reject) => {
      const query = 'SELECT id FROM daily_tasks WHERE id = ? AND user_id = ?';
      userDB.db.get(query, [taskId, userId], (err, task) => {
        if (err) {
          console.error('❌ [UPLOAD-FILES] Error verificando tarea:', err);
          reject(err);
          return;
        }
        resolve(task);
      });
    });

    if (!taskExists) {
      console.log(`⚠️ [UPLOAD-FILES] Tarea no encontrada o no pertenece al usuario: ${taskId}`);
      return res.status(404).json({
        error: 'Tarea no encontrada'
      });
    }

    console.log(`✅ [UPLOAD-FILES] Tarea verificada: ${taskId}`);

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No se proporcionaron archivos'
      });
    }

    const results = [];

    for (const file of files) {
      const isImage = file.mimetype.startsWith('image/');

      const attachmentData = {
        filename: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        is_image: isImage
      };

      console.log(`📎 [UPLOAD-FILES] Procesando archivo: ${file.originalname}`);

      const result = await userDB.addAttachment(taskId, userId, attachmentData);
      results.push({
        ...result,
        file: {
          id: result.id,
          filename: file.filename,
          original_name: file.originalname,
          size: file.size,
          type: file.mimetype,
          is_image: isImage
        }
      });
    }

    console.log(`✅ [UPLOAD-FILES] ${results.length} archivo(s) subido(s) exitosamente`);

    res.json({
      success: true,
      files: results
    });

  } catch (error) {
    console.error('❌ [UPLOAD-FILES] Error:', error);
    res.status(500).json({
      error: 'Error al subir archivos: ' + error.message
    });
  }
});

// Eliminar archivo adjunto
app.delete('/api/attachments/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user.userId;

    console.log(`🗑️ [DELETE-ATTACHMENT] Eliminando archivo: ${attachmentId}`);

    const result = await userDB.deleteAttachment(attachmentId, userId);

    res.json(result);

  } catch (error) {
    console.error('❌ [DELETE-ATTACHMENT] Error:', error);
    res.status(500).json({
      error: 'Error al eliminar archivo'
    });
  }
});

// Agregar subtarea
app.post('/api/task-details/:taskId/subtasks', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    const { text, order_index } = req.body;

    console.log(`➕ [ADD-SUBTASK] Nueva subtarea para tarea: ${taskId}`);
    console.log(`📋 [ADD-SUBTASK] Datos recibidos:`, { taskId, userId, text, order_index });

    const result = await userDB.addSubtask(taskId, userId, {
      text,
      order_index
    });

    console.log(`✅ [ADD-SUBTASK] Resultado de addSubtask:`, result);
    res.json(result);

  } catch (error) {
    console.error('❌ [ADD-SUBTASK] Error:', error);
    res.status(500).json({
      error: 'Error al agregar subtarea'
    });
  }
});

// Actualizar subtarea
app.put('/api/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const userId = req.user.userId;
    const { text, completed } = req.body;

    console.log(`✏️ [UPDATE-SUBTASK] Actualizando subtarea: ${subtaskId}`);

    const result = await userDB.updateSubtask(subtaskId, userId, {
      text,
      completed
    });

    res.json(result);

  } catch (error) {
    console.error('❌ [UPDATE-SUBTASK] Error:', error);
    res.status(500).json({
      error: 'Error al actualizar subtarea'
    });
  }
});

// Eliminar subtarea
app.delete('/api/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const userId = req.user.userId;

    console.log(`🗑️ [DELETE-SUBTASK] Eliminando subtarea: ${subtaskId}`);

    const result = await userDB.deleteSubtask(subtaskId, userId);

    res.json(result);

  } catch (error) {
    console.error('❌ [DELETE-SUBTASK] Error:', error);
    res.status(500).json({
      error: 'Error al eliminar subtarea'
    });
  }
});

// Servir archivos adjuntos
app.get('/api/attachments/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads/tasks', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.sendFile(filePath);

  } catch (error) {
    console.error('❌ [SERVE-FILE] Error:', error);
    res.status(500).json({
      error: 'Error al servir archivo'
    });
  }
});

app.get('/api/projects/:projectId/daily-tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const dailyTasks = await userDB.getProjectDailyTasks(req.user.userId, projectId);
    res.json(dailyTasks);
  } catch (error) {
    console.error('Error getting project daily tasks:', error);
    res.status(500).json({ error: 'Error getting project daily tasks' });
  }
});

// Endpoint para crear nuevos proyectos
app.post('/api/auth/projects', authenticateToken, async (req, res) => {
  try {
    const { project } = req.body;
    console.log('🚀 Creando proyecto:', project);
    console.log('👤 Usuario ID:', req.user.userId);

    if (!project || !project.title) {
      return res.status(400).json({
        success: false,
        error: 'Datos de proyecto inválidos'
      });
    }

    const newProject = await userDB.createProject(req.user.userId, project);
    console.log('✅ Proyecto creado:', newProject);

    res.json({
      success: true,
      project: newProject
    });
  } catch (error) {
    console.error('❌ Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating project'
    });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    // Cargar proyectos y tareas diarias
    const [projects, dailyTasks] = await Promise.all([
      userDB.getUserProjects(req.user.userId),
      userDB.getUserDailyTasks(req.user.userId)
    ]);

    // Intentar cargar configuración del asistente, pero no fallar si no existe
    let assistantConfig = null;
    try {
      assistantConfig = await userDB.getUserAssistantConfig(req.user.userId);
    } catch (configError) {
      console.log('Config no encontrada, continuando sin ella');
    }

    res.json({
      projects: projects || [],
      dailyTasks: dailyTasks || [],
      assistantConfig: assistantConfig || null,
      user: {
        email: req.user.email,
        name: req.user.name,
        subscription_type: req.user.subscription_type || 'free'
      }
    });
  } catch (error) {
    console.error('Error loading user profile:', error);
    res.status(500).json({ error: 'Error cargando datos de usuario' });
  }
});

// Admin routes - SOLO para administradores
const ADMIN_EMAILS = ['erivadeneiraq@gmail.com']; // Lista de emails admin

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: 'Acceso denegado - Se requieren permisos de administrador' });
  }

  next();
};

// Obtener todos los usuarios (solo admin)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔧 [ADMIN] Obteniendo lista de usuarios');

    const query = `
      SELECT id, email, name, subscription_type, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    userDB.db.all(query, [], (err, users) => {
      if (err) {
        console.error('❌ [ADMIN] Error obteniendo usuarios:', err);
        return res.status(500).json({ error: 'Error al obtener usuarios' });
      }

      console.log(`✅ [ADMIN] ${users.length} usuarios obtenidos`);
      res.json({
        success: true,
        users: users,
        total: users.length
      });
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error general:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Actualizar subscripción de usuario (solo admin)
app.put('/api/admin/users/:userId/subscription', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscription_type } = req.body;

    console.log('🔧 [ADMIN] Actualizando subscripción:', { userId, subscription_type, adminEmail: req.user.email });

    if (!['free', 'premium'].includes(subscription_type)) {
      return res.status(400).json({ error: 'Tipo de subscripción inválido' });
    }

    const updateQuery = 'UPDATE users SET subscription_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    userDB.db.run(updateQuery, [subscription_type, userId], function(err) {
      if (err) {
        console.error('❌ [ADMIN] Error actualizando subscripción:', err);
        return res.status(500).json({ error: 'Error al actualizar subscripción' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log(`✅ [ADMIN] Subscripción actualizada: Usuario ${userId} → ${subscription_type}`);
      res.json({
        success: true,
        message: 'Subscripción actualizada correctamente',
        userId: userId,
        subscription_type: subscription_type
      });
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error general:', error);
    res.status(500).json({ error: 'Error al actualizar subscripción' });
  }
});

// Obtener estadísticas de admin
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 [ADMIN] Obteniendo estadísticas');

    const statsQuery = `
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN subscription_type = 'premium' THEN 1 ELSE 0 END) as premium_users,
        SUM(CASE WHEN subscription_type = 'free' OR subscription_type IS NULL THEN 1 ELSE 0 END) as free_users,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_users_30d,
        COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_users_7d
      FROM users
    `;

    userDB.db.get(statsQuery, [], (err, stats) => {
      if (err) {
        console.error('❌ [ADMIN] Error obteniendo estadísticas:', err);
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
      }

      const conversionRate = stats.total_users > 0
        ? Math.round((stats.premium_users / stats.total_users) * 100)
        : 0;

      const result = {
        success: true,
        stats: {
          ...stats,
          conversion_rate: conversionRate
        }
      };

      console.log('✅ [ADMIN] Estadísticas obtenidas:', result.stats);
      res.json(result);
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error general:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Cambiar estado de usuario (bloquear/desbloquear) - Solo admin
app.put('/api/admin/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    console.log('🔧 [ADMIN] Cambiando estado de usuario:', { userId, is_active, adminEmail: req.user.email });

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active debe ser un boolean' });
    }

    const updateQuery = 'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    userDB.db.run(updateQuery, [is_active ? 1 : 0, userId], function(err) {
      if (err) {
        console.error('❌ [ADMIN] Error cambiando estado de usuario:', err);
        return res.status(500).json({ error: 'Error al cambiar estado de usuario' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log(`✅ [ADMIN] Estado actualizado: Usuario ${userId} → ${is_active ? 'activo' : 'bloqueado'}`);
      res.json({
        success: true,
        message: 'Estado de usuario actualizado correctamente',
        userId: userId,
        is_active: is_active
      });
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error general:', error);
    res.status(500).json({ error: 'Error al cambiar estado de usuario' });
  }
});

// Eliminar usuario completamente - Solo admin
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🗑️ [ADMIN] Eliminando usuario y todos sus datos:', { userId, adminEmail: req.user.email });

    // Verificar que el usuario existe
    const checkUserQuery = 'SELECT email FROM users WHERE id = ?';

    userDB.db.get(checkUserQuery, [userId], (err, user) => {
      if (err) {
        console.error('❌ [ADMIN] Error verificando usuario:', err);
        return res.status(500).json({ error: 'Error al verificar usuario' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Prevenir que el admin se elimine a sí mismo
      if (user.email === req.user.email) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
      }

      // Eliminar usuario y todos sus datos relacionados (CASCADE debería manejar esto)
      const deleteUserQuery = 'DELETE FROM users WHERE id = ?';

      userDB.db.run(deleteUserQuery, [userId], function(deleteErr) {
        if (deleteErr) {
          console.error('❌ [ADMIN] Error eliminando usuario:', deleteErr);
          return res.status(500).json({ error: 'Error al eliminar usuario' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log(`✅ [ADMIN] Usuario eliminado completamente: ${user.email} (${userId})`);
        res.json({
          success: true,
          message: 'Usuario y todos sus datos eliminados correctamente',
          userId: userId,
          email: user.email
        });
      });
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error general:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🔄 Cerrando servidor...');
  assistant.shutdown();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const startServer = async () => {
  await initializeAssistant();

  // Inicializar sistema de backup automático
  console.log('💾 Inicializando sistema de backup...');
  await backupSystem.init();
  await backupSystem.scheduleBackups();

  // Ejecutar migraciones de base de datos
  console.log('🔧 Ejecutando migraciones de base de datos...');
  const migrations = new DatabaseMigrations(path.join(__dirname, 'data/users.db'));
  await migrations.runMigrations();
  migrations.close();

  // Auto-configurar cuenta premium de prueba
  console.log('🌟 Configurando cuenta premium de prueba...');
  try {
    await userDB.waitForReady();
    const premiumResult = await new Promise((resolve, reject) => {
      userDB.db.run(
        "UPDATE users SET subscription_type = 'premium' WHERE email = 'erivadeneiraq@gmail.com'",
        function(err) {
          if (err) {
            console.error('❌ Error configurando premium:', err);
            reject(err);
          } else {
            console.log(`✅ Cuenta premium configurada (${this.changes} filas afectadas)`);
            resolve(this.changes);
          }
        }
      );
    });

    // Verificar que se aplicó
    const verifyResult = await new Promise((resolve, reject) => {
      userDB.db.get(
        "SELECT email, subscription_type FROM users WHERE email = 'erivadeneiraq@gmail.com'",
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (verifyResult) {
      console.log(`🎯 Verificado: ${verifyResult.email} = ${verifyResult.subscription_type}`);
    } else {
      console.log('⚠️ Usuario erivadeneiraq@gmail.com no encontrado');
    }
  } catch (error) {
    console.error('❌ Error en configuración premium:', error);
  }

  app.listen(PORT, '0.0.0.0', () => {
    const now = new Date().toLocaleString('es-ES');
    console.log(`🚀🚀🚀🚀🚀 Servidor ejecutándoseeeeeeeeeeee aqui en http://0.0.0.0:${PORT} - ${now}`);
    console.log(`📡📡📡 NUEVO CAMBIOOK  Accesible desde localhost: http://localhost:${PORT}`);
    console.log(`📱 Accesible desde red local: http://[tu-ip-local]:${PORT} - ${now}`);
    console.log(`📡 API disponible en /api/ - ${now}`);
    console.log(`💾 Sistema de backup automático: ✅ ACTIVO`);
  });
};

startServer().catch(error => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

module.exports = app;