# 🚀 Manual Completo del Desarrollador - SmartChatix Project Manager

#Comandos
Buscar por puertos el proceso del express
lsof -i:3001
Matar el proceso
kill PID
Iniciar el servidor
npm run server

o

  npm run server &    # El & lo ejecuta en background


## 📋 Tabla de Contenidos
1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Sistema de Autenticación](#sistema-de-autenticación)
5. [Base de Datos](#base-de-datos)
6. [Frontend (React)](#frontend-react)
7. [Backend (Express)](#backend-express)
8. [Sistema de IA](#sistema-de-ia)
9. [Flujo de Datos](#flujo-de-datos)
10. [Comandos y Scripts](#comandos-y-scripts)
11. [Deployment](#deployment)
12. [Preguntas Típicas de Entrevista](#preguntas-típicas-de-entrevista)

---

## 🏗️ Arquitectura General

### Tipo de Aplicación
**Full-Stack SPA (Single Page Application)** con arquitectura cliente-servidor

### Componentes Principales
```
┌─────────────────┐    HTTP/API    ┌─────────────────┐    SQL    ┌─────────────────┐
│    FRONTEND     │◄──────────────►│     BACKEND     │◄─────────►│    DATABASE     │
│   React + Vite  │                │   Express.js    │           │     SQLite      │
│   Puerto 5173   │                │   Puerto 3001   │           │   users.db      │
└─────────────────┘                └─────────────────┘           └─────────────────┘
         │                                   │                            │
         ▼                                   ▼                            ▼
┌─────────────────┐                ┌─────────────────┐          ┌─────────────────┐
│  CARACTERÍSTICAS│                │  CARACTERÍSTICAS│          │  CARACTERÍSTICAS│
│  - Hot Reload   │                │  - API REST     │          │  - 10 Tablas    │
│  - State Mgmt   │                │  - JWT Auth     │          │  - Relaciones   │
│  - Voice API    │                │  - Middleware   │          │  - Índices      │
│  - Responsive   │                │  - File Serving │          │  - Transacciones│
└─────────────────┘                └─────────────────┘          └─────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18**: Framework principal con hooks
- **Vite**: Build tool y dev server (más rápido que Create React App)
- **Tailwind CSS**: Framework de utilidades CSS
- **Lucide React**: Librería de iconos
- **React Markdown**: Renderizado de markdown para mensajes de IA

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web minimalista
- **SQLite3**: Base de datos relacional embebida
- **JWT**: Tokens de autenticación
- **bcryptjs**: Hashing de contraseñas
- **Passport.js**: Middleware de autenticación (Google OAuth)

### APIs Externas
- **OpenAI API**: Para el asistente de IA
- **Web Speech API**: Reconocimiento y síntesis de voz
- **Google OAuth**: Autenticación social

---

## 📁 Estructura del Proyecto

```
project_manager/
├── 📄 package.json              # Dependencias y scripts
├── 📄 server.js                 # Servidor Express principal
├── 📄 manager.jsx               # Componente React principal (7000+ líneas)
├── 📄 vite.config.js            # Configuración de Vite
├── 📄 index.html                # Punto de entrada HTML
├── 📁 src/
│   ├── 📄 main.jsx              # Entry point de React
│   ├── 📄 index.css             # Estilos globales
│   ├── 📁 components/
│   │   └── Auth.jsx             # Componente de autenticación
│   ├── 📁 hooks/
│   │   └── useAuth.js           # Hook personalizado de auth
│   ├── 📁 database/
│   │   └── userDatabase.js      # Clase de base de datos
│   ├── 📁 routes/
│   │   └── authRoutes.js        # Rutas de API autenticadas
│   ├── 📁 config/
│   │   └── promptConfig.js      # Configuración de prompts IA
│   ├── 📄 assistantManager.js   # Gestor del asistente IA
│   ├── 📄 userMemory.js         # Sistema de memoria del usuario
│   └── 📄 dailyScheduler.js     # Programador de tareas diarias
├── 📁 data/
│   └── users.db                 # Base de datos SQLite
├── 📁 dist/                     # Build de producción (generado)
└── 📁 public/                   # Archivos estáticos
```

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

#### 1. Registro de Usuario
```javascript
POST /api/auth/register
Body: { email, password, name }
Proceso:
1. Validar email único
2. Hash password con bcrypt (10 salt rounds)
3. Crear UUID para user ID
4. Guardar en tabla 'users'
5. Crear configuración de asistente por defecto
6. Generar JWT token
7. Responder con user + token
```

#### 2. Login
```javascript
POST /api/auth/login
Body: { email, password }
Proceso:
1. Buscar usuario por email
2. Comparar password con bcrypt.compare()
3. Actualizar last_login
4. Generar JWT token (7 días de expiración)
5. Guardar sesión en tabla 'user_sessions'
6. Responder con user + token
```

#### 3. Verificación de Token
```javascript
Middleware: authenticateToken()
Headers: Authorization: Bearer <token>
Proceso:
1. Extraer token del header Authorization
2. Verificar con jwt.verify()
3. Buscar sesión en base de datos
4. Verificar expiración
5. Agregar user a req.user
6. Continuar al siguiente middleware
```

#### 4. Google OAuth
```javascript
Flujo:
1. GET /auth/google → Redirect a Google
2. Google → GET /auth/google/callback
3. Passport procesa el perfil
4. Generar JWT para usuario Google
5. Redirect al frontend con token
```

### Seguridad Implementada
- **Password Hashing**: bcrypt con 10 salt rounds
- **JWT Tokens**: 7 días de expiración
- **Session Management**: Tokens almacenados en DB
- **CORS**: Configuración restrictiva de dominios
- **Input Validation**: Validación de email y passwords
- **SQL Injection**: Queries parametrizadas

---

## 🗄️ Base de Datos

### Schema Completo (10 Tablas)

#### 1. **users** - Cuentas de usuario
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID
  email TEXT UNIQUE NOT NULL,       -- Email único
  password TEXT NOT NULL,           -- bcrypt hash
  name TEXT NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1,
  subscription_type TEXT DEFAULT 'free'
);
```

#### 2. **user_projects** - Proyectos del usuario
```sql
CREATE TABLE user_projects (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL,            -- FK to users
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'media',    -- alta, media, baja
  status TEXT DEFAULT 'activo',     -- activo, completado, pausado
  progress INTEGER DEFAULT 0,       -- 0-100
  deadline TEXT,                    -- YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. **project_tasks** - Tareas dentro de proyectos
```sql
CREATE TABLE project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,         -- FK to user_projects
  user_id TEXT NOT NULL,            -- FK to users
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  progress INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES user_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 4. **daily_tasks** - Tareas diarias independientes
```sql
CREATE TABLE daily_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  project_id TEXT,                  -- Opcional FK
  project_task_id TEXT,             -- Opcional FK
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 5. **user_assistant_config** - Configuración del asistente IA
```sql
CREATE TABLE user_assistant_config (
  user_id TEXT PRIMARY KEY,
  base_prompt TEXT,
  system_prompt TEXT,
  user_name TEXT,
  assistant_name TEXT DEFAULT 'Elon Musk',
  specialties TEXT,                 -- JSON array
  tone TEXT DEFAULT 'Motivador',
  focus_areas TEXT,                 -- JSON object
  memory TEXT,                      -- JSON object
  voice_enabled BOOLEAN DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 6. **chat_messages** - Historial de conversaciones
```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,               -- 'user' o 'assistant'
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  function_results TEXT,            -- JSON para resultados de funciones
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 7. **assistant_insights** - Sistema de memoria de IA
```sql
CREATE TABLE assistant_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,       -- 'achievement', 'pattern', 'challenge', 'goal'
  content TEXT NOT NULL,
  context TEXT,
  importance_level INTEGER DEFAULT 3, -- 1-5
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_mentioned DATETIME,
  mention_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 8. **user_sessions** - Gestión de sesiones
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 9. **user_commitments** - Compromisos y metas
```sql
CREATE TABLE user_commitments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  commitment TEXT NOT NULL,
  deadline DATE,
  status TEXT DEFAULT 'pending',    -- pending, completed, overdue
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  follow_up_count INTEGER DEFAULT 0,
  last_follow_up DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 10. **user_achievements** - Logros del usuario
```sql
CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement TEXT NOT NULL,
  achievement_type TEXT,            -- task_completion, project_milestone, etc.
  related_project_id TEXT,
  celebration_level INTEGER DEFAULT 3, -- 1-5
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Relaciones Clave
- **Users → Projects**: 1:N con CASCADE DELETE
- **Projects → Tasks**: 1:N con CASCADE DELETE
- **Users → Daily Tasks**: 1:N con CASCADE DELETE
- **Users → Assistant Config**: 1:1 con CASCADE DELETE
- **Users → Sessions**: 1:N con CASCADE DELETE

---

## ⚛️ Frontend (React)

### Componente Principal: PersonalCoachAssistant

#### Estado Principal
```javascript
const PersonalCoachAssistant = () => {
  // Autenticación (custom hook)
  const { user, loading: authLoading, isAuthenticated, login, logout, authenticatedFetch } = useAuth();

  // Estado de datos
  const [projects, setProjects] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);

  // Estado de UI
  const [activeView, setActiveView] = useState('dashboard');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('retro');

  // Sistema de timers
  const [taskTimers, setTaskTimers] = useState({});
  const [activeTimer, setActiveTimer] = useState(null);

  // Asistente IA
  const [assistantConfig, setAssistantConfig] = useState({
    basePrompt: "Eres mi asistente coach personal...",
    userName: "",
    assistantName: "Elon Musk",
    specialties: ["Desarrollo de Software"],
    tone: "Motivador",
    focusAreas: { proyectos: true, tareas: true }
  });

  // Chat y voz
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // ... resto del estado
};
```

#### Estructura de Vistas
```javascript
// Vista principal con navegación
return (
  <div className="min-h-screen">
    {!isAuthenticated ? (
      <Auth onLogin={handleAuthSuccess} />
    ) : (
      <>
        <Header />  // Navegación y usuario
        <MainContent>
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'projects' && renderProjectsView()}
          {activeView === 'assistant' && renderAssistantView()}
        </MainContent>
        <ChatBubble />  // Chat flotante
      </>
    )}
  </div>
);
```

#### Funciones Clave del Frontend

##### 1. Gestión de Datos
```javascript
// Cargar datos del usuario
const loadUserData = useCallback(async () => {
  try {
    const response = await authenticatedFetch(`${getApiBase()}/profile`);
    if (response.ok) {
      const data = await response.json();
      setProjects(data.projects || []);
      setDailyTasks(data.dailyTasks || []);
      if (data.assistantConfig) {
        setAssistantConfig(data.assistantConfig);
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}, [authenticatedFetch]);

// Crear proyecto
const createProject = async (projectData) => {
  try {
    const response = await authenticatedFetch(`${getApiBase()}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });

    if (response.ok) {
      const newProject = await response.json();
      setProjects(prev => [...prev, newProject]);
      setShowCreateProject(false);
    }
  } catch (error) {
    console.error('Error creating project:', error);
  }
};
```

##### 2. Sistema de Timers
```javascript
// Iniciar timer
const startTimer = async (taskId) => {
  // Pausar timer activo si existe
  if (activeTimer && activeTimer !== taskId) {
    pauseTimer(activeTimer);
  }

  setTaskTimers(prev => ({
    ...prev,
    [taskId]: {
      isActive: true,
      startTime: Date.now(),
      totalTime: prev[taskId]?.totalTime || 0
    }
  }));
  setActiveTimer(taskId);
};

// Pausar timer
const pauseTimer = (taskId) => {
  const timer = taskTimers[taskId];
  if (timer && timer.isActive) {
    const sessionTime = Date.now() - timer.startTime;
    setTaskTimers(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isActive: false,
        totalTime: timer.totalTime + sessionTime,
        startTime: null
      }
    }));
  }
  setActiveTimer(null);
};

// Formatear tiempo
const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
```

##### 3. Sistema de Voz
```javascript
// Configurar reconocimiento de voz
useEffect(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'es-ES';

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[event.results.length - 1].isFinal) {
        setNewMessage(transcript);
        setIsListening(false);
      }
    };
  }
}, []);

// Síntesis de voz
const speakText = (text) => {
  if (!voiceEnabled || !synthesisRef.current) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  synthesisRef.current.speak(utterance);
};
```

### Custom Hook: useAuth
```javascript
// src/hooks/useAuth.js
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función de login
  const login = async (email, password) => {
    try {
      const response = await fetch(`${getApiBase()}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función para hacer requests autenticados
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, []);

  return { user, loading, isAuthenticated: !!user, login, logout, authenticatedFetch };
};
```

---

## 🖥️ Backend (Express)

### Servidor Principal (server.js)

#### Configuración Inicial
```javascript
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Servir archivos estáticos (dist)
app.use(express.static('dist'));
```

#### CORS Configuration
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://app.smartchatix.com',
      /^http:\/\/192\.168\.\d+\.\d+:3001$/
    ];

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      return typeof allowedOrigin === 'string'
        ? origin === allowedOrigin
        : allowedOrigin.test(origin);
    });

    callback(null, isAllowed);
  },
  credentials: true
};
```

### Clase UserDatabase

#### Inicialización
```javascript
class UserDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/users.db');
    this.db = null;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.initDatabase();
  }

  async initDatabase() {
    await fs.ensureDir(path.dirname(this.dbPath));

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) throw err;
      console.log('✅ Conectado a SQLite');
    });

    await this.createTables();
  }
}
```

#### Métodos Principales
```javascript
// Registro de usuario
async register(email, password, name) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  return new Promise((resolve, reject) => {
    this.db.run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [userId, email, hashedPassword, name],
      function(err) {
        if (err) reject(err);
        resolve({ id: userId, email, name });
      }
    );
  });
}

// Login de usuario
async login(email, password) {
  const user = await this.getUserByEmail(email);
  if (!user) throw new Error('Usuario no encontrado');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error('Contraseña incorrecta');

  // Actualizar last_login
  await this.updateLastLogin(user.id);

  // Generar token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    this.jwtSecret,
    { expiresIn: '7d' }
  );

  // Guardar sesión
  await this.createSession(user.id, token);

  return { user, token };
}

// Verificar token
async verifyToken(token) {
  const decoded = jwt.verify(token, this.jwtSecret);
  const session = await this.getSession(token);

  if (!session || new Date(session.expires_at) < new Date()) {
    throw new Error('Sesión expirada');
  }

  return decoded;
}
```

### Rutas de Autenticación (authRoutes.js)

#### Middleware de Autenticación
```javascript
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const user = await userDB.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};
```

#### Rutas Principales
```javascript
// Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const { user, token } = await userDB.register(email, password, name);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await userDB.login(email, password);
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Perfil con datos
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [projects, dailyTasks, assistantConfig] = await Promise.all([
      userDB.getUserProjects(userId),
      userDB.getUserDailyTasks(userId),
      userDB.getAssistantConfig(userId)
    ]);

    res.json({
      user: req.user,
      projects,
      dailyTasks,
      assistantConfig
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🤖 Sistema de IA

### Assistant Manager
```javascript
class AssistantManager {
  constructor() {
    this.userMemory = new UserMemory();
    this.dailyScheduler = new DailyScheduler();
    this.isActive = false;
  }

  initialize() {
    this.isActive = true;
    this.sessionStartTime = new Date();
    return this.getDailyContext();
  }

  processUserMessage(message) {
    const context = this.userMemory.updateContext(message);
    this.userMemory.addToHistory('user', message);

    return {
      processed: true,
      contextUpdated: true,
      timestamp: new Date(),
      context
    };
  }

  async generateAIResponse(message, config) {
    const prompt = this.buildPrompt(message, config);

    // Llamada a OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

### Sistema de Memoria de Usuario
```javascript
class UserMemory {
  constructor() {
    this.memoryFile = path.join(__dirname, '../user_memory.json');
    this.data = this.loadMemory();
  }

  updateContext(message) {
    // Analizar el mensaje para extraer información
    const analysis = this.analyzeMessage(message);

    // Actualizar contexto según el análisis
    if (analysis.containsProject) {
      this.data.recentTopics.projects = true;
    }

    if (analysis.containsGoal) {
      this.data.recentTopics.goals = true;
    }

    // Actualizar estadísticas diarias
    this.updateDailyStats();

    this.saveMemory();
    return this.data;
  }

  addProject(project) {
    this.data.projects.push({
      ...project,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
    this.saveMemory();
  }

  getDailyContext() {
    return {
      user: this.data.user,
      projects: this.data.projects,
      dailyStats: this.data.dailyStats,
      recentTopics: this.data.recentTopics,
      sessionInfo: {
        messagesCount: this.data.chatHistory.length,
        startTime: new Date()
      }
    };
  }
}
```

---

## 🔄 Flujo de Datos

### 1. Autenticación
```
Usuario → Login Form → POST /api/auth/login → UserDatabase.login()
→ bcrypt.compare() → JWT.sign() → Response con token → localStorage
→ useAuth hook actualiza estado → Componente re-renderiza
```

### 2. Carga de Datos
```
Componente montado → useEffect → loadUserData() → GET /api/auth/profile
→ authenticatedFetch con Bearer token → authRoutes.js → UserDatabase queries
→ Promise.all([projects, tasks, config]) → Response → setState → UI actualizada
```

### 3. Creación de Proyecto
```
Form Submit → createProject() → POST /api/auth/projects → authenticateToken
→ UserDatabase.createProject() → INSERT SQL → Response con nuevo proyecto
→ setProjects([...prev, newProject]) → UI actualizada
```

### 4. Chat con IA
```
Usuario escribe → sendMessage() → POST /api/auth/assistant-chat
→ AssistantManager.processMessage() → OpenAI API call → AI response
→ UserMemory.addToHistory() → Response → setMessages → Chat actualizado
```

### 5. Sistema de Timers
```
Click Start Timer → startTimer(taskId) → setState timers → useEffect
→ setInterval para actualizar UI → Pausar → clearInterval
→ Calcular tiempo total → Opcional: sync con servidor
```

---

## 💻 Comandos y Scripts

### Scripts de Desarrollo
```bash
# Instalar dependencias
npm install

# Desarrollo (frontend + backend simultáneo)
npm run dev      # Vite dev server (puerto 5173)
npm run server   # Express server (puerto 3001)

# Producción
npm run build    # Build del frontend
npm run prod     # Build + Start servidor
npm start        # Solo servidor (alias de npm run server)
```

### Estructura de package.json
```json
{
  "scripts": {
    "dev": "vite",                    // Frontend development
    "build": "vite build",            // Build para producción
    "preview": "vite preview",        // Preview del build
    "start": "node server.js",        // Servidor producción
    "server": "node server.js",       // Servidor desarrollo
    "dev:full": "npm run build && npm run server"
  }
}
```

### Variables de Entorno
```bash
# .env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-session-secret
NODE_ENV=development
```

---

## 🚀 Deployment

### Estructura para Producción
```bash
# Build del frontend
npm run build
# Genera carpeta 'dist' con archivos estáticos

# El servidor Express sirve:
# 1. API en /api/*
# 2. Archivos estáticos desde /dist
# 3. SPA routing con app.get('*')
```

### Configuración de Vite para Producción
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

### Deployment en Servidor
```bash
# 1. Clonar repositorio
git clone <repo-url>

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores de producción

# 4. Build del frontend
npm run build

# 5. Iniciar servidor
npm start
# O con PM2: pm2 start server.js --name "smartchatix"
```

---

## ❓ Preguntas Típicas de Entrevista

### Arquitectura y Diseño

**P: ¿Por qué elegiste esta arquitectura monolítica en lugar de microservicios?**
R: Para un proyecto de este tamaño, un monolito es más eficiente porque:
- Menor complejidad de deployment
- Comunicación directa entre frontend y backend
- Base de datos única con transacciones ACID
- Más fácil de desarrollar y debuggear
- Escalabilidad suficiente para usuarios medianos

**P: ¿Cómo manejas el estado en React?**
R: Uso useState y useEffect para estado local, custom hooks como useAuth para lógica reutilizable, y localStorage para persistencia de tokens. No uso Redux porque el estado no es tan complejo como para justificar la complejidad adicional.

**P: ¿Por qué SQLite en lugar de PostgreSQL o MongoDB?**
R: SQLite es perfecto para este caso porque:
- Aplicación single-server
- Base de datos embebida (cero configuración)
- Soporte completo de SQL con relaciones
- Excelente rendimiento para <100k usuarios
- Fácil backup (un solo archivo)
- Menos dependencias de infraestructura

### Seguridad

**P: ¿Cómo aseguras la aplicación?**
R: Implemento múltiples capas:
- **Autenticación**: JWT con expiración de 7 días
- **Autorización**: Middleware que valida tokens en cada request
- **Passwords**: bcrypt con 10 salt rounds
- **SQL Injection**: Queries parametrizadas
- **CORS**: Configuración restrictiva de dominios
- **Sessions**: Tokens almacenados en DB para revocación
- **Input Validation**: Validación en frontend y backend

**P: ¿Qué harías para mejorar la seguridad?**
R: Añadiría:
- Rate limiting con express-rate-limit
- Helmet.js para headers de seguridad
- HTTPS en producción
- Refresh tokens para sesiones más largas
- 2FA opcional
- Logs de seguridad más detallados
- Sanitización de inputs más estricta

### Performance

**P: ¿Cómo optimizarías el rendimiento?**
R: Varias estrategias:
- **Frontend**: Code splitting, lazy loading, React.memo para componentes
- **Backend**: Índices en base de datos, caching con Redis
- **Red**: Compresión gzip, CDN para assets
- **Base de datos**: Paginación, queries optimizadas
- **Bundle**: Tree shaking, minificación

**P: ¿Cómo manejas el scaling?**
R: Escalabilidad horizontal:
- Load balancer (nginx)
- Múltiples instancias del servidor
- Base de datos distribuida (PostgreSQL con replicas)
- Cache distribuido (Redis Cluster)
- Assets en CDN
- Microservicios solo cuando sea necesario

### Tecnologías

**P: ¿Por qué React en lugar de Vue o Angular?**
R: React porque:
- Ecosistema más grande y maduro
- Mejor rendimiento con Virtual DOM
- Hooks simplifican el manejo de estado
- Más oportunidades laborales
- Mejor soporte para testing
- Comunidad más activa

**P: ¿Por qué Vite en lugar de Create React App?**
R: Vite es superior porque:
- Build time mucho más rápido (esbuild vs webpack)
- Hot reload instantáneo
- Mejor soporte para ES modules
- Configuración más simple
- Bundle size más pequeño
- Soporte nativo para TypeScript

### Específico del Proyecto

**P: ¿Cómo funciona el sistema de IA?**
R: El asistente tiene tres componentes:
1. **Configuración personalizable**: Prompts, personalidad, especialidades
2. **Sistema de memoria**: Guarda contexto e insights del usuario
3. **Integración con OpenAI**: Llamadas a GPT-4 con contexto personalizado

**P: ¿Cómo implementaste el sistema de timers?**
R: Timer system con:
- Estado local en React para UI responsiva
- Cálculo de tiempo con Date.now() y diferencias
- Persistencia opcional en servidor
- Solo un timer activo a la vez
- Formato HH:MM:SS para display

**P: ¿Qué mejoras agregarías?**
R: Roadmap de mejoras:
- **Testing**: Unit tests (Jest), E2E (Cypress)
- **Mobile**: App React Native o PWA
- **Colaboración**: Proyectos compartidos
- **Analytics**: Dashboards de productividad
- **Integraciones**: Google Calendar, Slack, Trello
- **Offline**: Service workers para PWA
- **Real-time**: WebSockets para colaboración

### Debugging y Problemática

**P: ¿Cómo debuggeas errores en producción?**
R: Estrategia de debugging:
- **Logs estructurados**: Winston con niveles
- **Error boundaries**: React error boundaries
- **Monitoring**: APM tools como Sentry
- **Health checks**: Endpoints de salud
- **Database**: Query logging y performance monitoring

**P: ¿Cómo manejas los errores de red?**
R: Error handling robusto:
- Try-catch en todas las async functions
- Retry logic para requests fallidos
- Fallbacks para funcionalidades offline
- User feedback con toast notifications
- Graceful degradation

---

## 🎯 Puntos Clave para la Entrevista

### Lo que Debes Enfatizar

1. **Arquitectura Full-Stack Completa**
   - Frontend React moderno con hooks
   - Backend Express con arquitectura REST
   - Base de datos relacional bien estructurada
   - Autenticación y autorización robusta

2. **Características Avanzadas**
   - Sistema de IA personalizable
   - Integración de voz (Speech API)
   - Autenticación social (Google OAuth)
   - Sistema de timers en tiempo real
   - Themes personalizables

3. **Mejores Prácticas**
   - Código modular y mantenible
   - Seguridad en múltiples capas
   - Error handling comprehensivo
   - Estado bien gestionado
   - API RESTful consistente

4. **Tecnologías Modernas**
   - Vite en lugar de CRA
   - JWT para auth
   - bcrypt para passwords
   - Custom hooks en React
   - ES6+ JavaScript

### Posibles Debilidades (y Cómo Responder)

**"No tienes tests"**
R: "Cierto, en este prototipo me enfoqué en funcionalidad. Para producción implementaría Jest para unit tests, React Testing Library para componentes, y Cypress para E2E."

**"SQLite no escala"**
R: "Para el alcance actual es perfecto. Para scaling futuro migraría a PostgreSQL manteniendo el mismo schema, ya que el código ORM es compatible."

**"Monolito en lugar de microservicios"**
R: "Empezar con monolito es la mejor práctica. Martin Fowler recomienda 'monolith first'. Cuando llegues a limitaciones reales, puedes extraer microservicios específicos."

---

## 🚀 Mensaje Final

Este proyecto demuestra:
- **Competencia full-stack completa**
- **Conocimiento de tecnologías modernas**
- **Capacidad de integrar APIs complejas**
- **Enfoque en experiencia de usuario**
- **Arquitectura escalable y mantenible**

**Tienes un proyecto sólido que muestra skills de desarrollador senior. ¡Confía en tu conocimiento y explícalo con pasión!**

---

*Manual creado para preparación de entrevista - SmartChatix Project Manager*
*Versión completa del desarrollador - Octubre 2024*