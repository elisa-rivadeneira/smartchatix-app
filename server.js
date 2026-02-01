require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AssistantManager = require('./src/assistantManager');
const UserDatabase = require('./src/database/userDatabase');
const { router: authRoutes, authenticateToken } = require('./src/routes/authRoutes');
const DatabaseBackupSystem = require('./backup_system');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

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

      // Aquí guardarías el usuario en tu base de datos
      // Por ahora, devolvemos el perfil directamente
      const user = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value,
        googleId: profile.id
      };

      console.log('✅ Google OAuth Strategy - User created:', user);
      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth Strategy - Error:', error);
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
    // Permitir imágenes y documentos comunes
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
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
app.get('/api/assistant/status', authenticateToken, (req, res) => {
  const context = assistant.getDailyContext();
  res.json({
    active: assistant.isActive,
    context: context,
    sessionStartTime: assistant.sessionStartTime
  });
});

app.get('/api/assistant/context', authenticateToken, (req, res) => {
  const context = assistant.getDailyContext();
  res.json(context);
});

app.post('/api/assistant/message', authenticateToken, (req, res) => {
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

app.post('/api/assistant/response', authenticateToken, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = assistant.sendAssistantMessage(message);
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

app.get('/api/assistant/chat-history', authenticateToken, (req, res) => {
  try {
    const chatHistory = assistant.getChatHistory();
    res.json(chatHistory);
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Error getting chat history' });
  }
});

app.get('/api/assistant/summary', authenticateToken, (req, res) => {
  try {
    const summary = assistant.generateDailySummary();
    res.json(summary);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Error generating summary' });
  }
});

app.post('/api/assistant/morning-greeting', authenticateToken, (req, res) => {
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
      assistantConfig: assistantConfig || null
    });
  } catch (error) {
    console.error('Error loading user profile:', error);
    res.status(500).json({ error: 'Error cargando datos de usuario' });
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