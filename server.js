require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AssistantManager = require('./src/assistantManager');
const { router: authRoutes, authenticateToken } = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize assistant
const assistant = new AssistantManager();
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
app.use(express.json());

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
const callbackURL = process.env.NODE_ENV === 'production'
  ? 'https://app.smartchatix.com/auth/google/callback'
  : '/auth/google/callback';

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
      // Aquí guardarías el usuario en tu base de datos
      // Por ahora, devolvemos el perfil directamente
      const user = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value,
        googleId: profile.id
      };
      return done(null, user);
    } catch (error) {
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

app.use(express.static('dist'));

// Google OAuth routes (solo si las credenciales están configuradas)
if (googleClientId && googleClientSecret) {
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
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
        const frontendUrl = process.env.NODE_ENV === 'production'
          ? 'https://app.smartchatix.com'
          : 'http://localhost:5173';

        // Redireccionar al frontend con éxito y token
        res.redirect(`${frontendUrl}/?login=success&user=${encodeURIComponent(JSON.stringify(req.user))}&token=${encodeURIComponent(token)}`);
      } catch (error) {
        console.error('Error generating token for Google user:', error);
        const frontendUrl = process.env.NODE_ENV === 'production'
          ? 'https://app.smartchatix.com'
          : 'http://localhost:5173';
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
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://app.smartchatix.com'
      : 'http://localhost:5173';
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

app.post('/api/assistant/project', authenticateToken, (req, res) => {
  const projectData = req.body;

  try {
    const project = assistant.addProject(projectData);
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

  app.listen(PORT, '0.0.0.0', () => {
    const now = new Date().toLocaleString('es-ES');
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT} - ${now}`);
    console.log(`📡 Accesible desde localhost: http://localhost:${PORT}`);
    console.log(`📱 Accesible desde red local: http://[tu-ip-local]:${PORT} - ${now}`);
    console.log(`📡 API disponible en /api/ - ${now}`);
  });
};

startServer().catch(error => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

module.exports = app;