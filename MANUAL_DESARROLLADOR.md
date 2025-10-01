# 🚀 Manual del Desarrollador - Smartchatix Project Manager

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Tecnologías Utilizadas](#tecnologías-utilizadas)
5. [Funcionalidades Principales](#funcionalidades-principales)
6. [Base de Datos](#base-de-datos)
7. [API Endpoints](#api-endpoints)
8. [Estados y Gestión de Datos](#estados-y-gestión-de-datos)
9. [Sistema de Timers](#sistema-de-timers)
10. [Sistema de Autenticación](#sistema-de-autenticación)
11. [Configuración y Personalización](#configuración-y-personalización)
12. [Comandos de Desarrollo](#comandos-de-desarrollo)
13. [Mejoras Futuras](#mejoras-futuras)

---

## 🎯 Visión General

**Smartchatix Project Manager** es una aplicación completa de gestión de proyectos y productividad personal que combina:

- ✅ **Gestión de Proyectos**: Crear, organizar y trackear proyectos
- ⏱️ **Sistema de Timers**: Cronómetro inteligente con persistencia
- 🤖 **Asistente IA**: Coach personal integrado con OpenAI
- 📊 **Analytics**: Métricas de tiempo y productividad
- 🎨 **UI Retro-Futurista**: Diseño Synthwave de los 80s

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   DATABASE      │
│   React SPA     │◄──►│   Express.js    │◄──►│   SQLite        │
│   - manager.jsx │    │   - server.js   │    │   - users.db    │
│   - Vite        │    │   - Auth Routes │    │   - Tables      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PERSISTENCIA   │    │   APIs EXTERNAS │    │   SEGURIDAD     │
│  - localStorage │    │   - OpenAI      │    │   - JWT Tokens  │
│  - Timer States │    │   - Text-to-Speech │  │   - bcrypt      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📁 Estructura de Archivos

```
project_manager/
├── 📄 manager.jsx              # Componente principal (7000+ líneas)
├── 📄 server.js               # Servidor Express
├── 📄 package.json            # Dependencias y scripts
├── 📄 vite.config.js          # Configuración de Vite
├── 📄 index.html              # Punto de entrada
├── 📁 src/
│   ├── 📁 components/
│   │   └── Auth.jsx           # Componente de autenticación
│   ├── 📁 hooks/
│   │   └── useAuth.js         # Hook de autenticación
│   ├── 📁 config/
│   │   └── promptConfig.js    # Configuración de prompts IA
│   └── 📁 routes/
│       └── authRoutes.js      # Rutas API autenticadas
├── 📁 data/
│   └── users.db              # Base de datos SQLite
└── 📁 docs/
    └── MANUAL_DESARROLLADOR.md # Este archivo
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18**: Framework principal
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework de estilos
- **Lucide React**: Iconografía
- **React Markdown**: Renderizado de markdown

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **SQLite3**: Base de datos
- **JWT**: Autenticación
- **bcryptjs**: Hashing de contraseñas
- **CORS**: Cross-Origin Resource Sharing

### APIs Externas
- **OpenAI API**: Inteligencia artificial
- **Web Speech API**: Síntesis de voz
- **SpeechRecognition API**: Reconocimiento de voz

---

## ⚡ Funcionalidades Principales

### 1. **Gestión de Proyectos**
```javascript
// Estructura de un proyecto
const project = {
  id: "uuid",
  name: "Nombre del Proyecto",
  description: "Descripción",
  status: "active", // active, completed, paused
  priority: "high", // high, medium, low
  deadline: "2024-12-31",
  estimatedHours: 40,
  actualHours: 25,
  progress: 62.5,
  createdAt: "2024-01-01",
  tasks: [/* array de tareas */]
}
```

### 2. **Sistema de Tareas**
```javascript
// Estructura de una tarea
const task = {
  id: "timestamp_or_uuid",
  title: "Título de la tarea",
  text: "Descripción",
  completed: false,
  progress: 0,
  estimatedHours: 2,
  actualHours: 1.5,
  projectId: "uuid_proyecto", // null para tareas personales
  projectTaskId: "uuid_tarea_proyecto",
  timeStarted: "timestamp",
  createdAt: "2024-01-01"
}
```

### 3. **Sistema de Timers Inteligente**
```javascript
// Estados del timer
const timerStates = {
  activeTimers: {}, // {taskId: startTime}
  pausedTimers: {}, // {taskId: accumulatedTime}
  timerIntervals: {}, // {taskId: intervalId}
  timerMode: "una_tarea" // "una_tarea" o "multiples"
}
```

---

## 🗄️ Base de Datos

### Tabla: `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: `projects`
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  deadline DATE,
  estimated_hours REAL,
  actual_hours REAL,
  progress REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tabla: `project_tasks`
```sql
CREATE TABLE project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  progress REAL DEFAULT 0,
  estimated_hours REAL,
  actual_hours REAL,
  time_started DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tabla: `daily_tasks`
```sql
CREATE TABLE daily_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  project_id TEXT,
  project_task_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (project_task_id) REFERENCES project_tasks(id)
);
```

### Tabla: `assistant_config`
```sql
CREATE TABLE assistant_config (
  user_id TEXT PRIMARY KEY,
  base_prompt TEXT,
  system_prompt TEXT,
  user_name TEXT,
  assistant_name TEXT,
  specialties TEXT, -- JSON array
  tone TEXT,
  focus_areas TEXT, -- JSON object
  memory TEXT, -- JSON object
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔗 API Endpoints

### Autenticación
```javascript
POST /api/auth/register    // Registro de usuario
POST /api/auth/login       // Iniciar sesión
GET  /api/auth/verify      // Verificar token
GET  /api/auth/profile     // Obtener perfil
PUT  /api/auth/change-password // Cambiar contraseña
```

### Proyectos
```javascript
GET    /api/auth/projects           // Listar proyectos
POST   /api/auth/projects           // Crear proyecto
PUT    /api/auth/projects/:id       // Actualizar proyecto
DELETE /api/auth/projects/:id       // Eliminar proyecto
```

### Tareas de Proyecto
```javascript
GET    /api/auth/project-tasks      // Listar tareas
POST   /api/auth/project-tasks      // Crear tarea
PUT    /api/auth/project-tasks/:id  // Actualizar tarea
DELETE /api/auth/project-tasks/:id  // Eliminar tarea
```

### Tareas Diarias
```javascript
POST   /api/auth/daily-tasks        // Crear tarea diaria
DELETE /api/auth/daily-tasks/:id    // Eliminar tarea diaria
```

### Asistente IA
```javascript
POST /api/auth/assistant-config     // Guardar configuración
POST /api/auth/assistant-chat       // Chat con IA
```

---

## 🎛️ Estados y Gestión de Datos

### Estados Principales (React)
```javascript
// Autenticación
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);

// Datos principales
const [projects, setProjects] = useState([]);
const [dailyTasks, setDailyTasks] = useState([]);

// UI States
const [currentView, setCurrentView] = useState('dashboard');
const [showProjectModal, setShowProjectModal] = useState(false);
const [showProjectSelectionModal, setShowProjectSelectionModal] = useState(false);

// Timer States (con persistencia)
const [activeTimers, setActiveTimers] = useState(() => {
  const saved = localStorage.getItem('activeTimers');
  return saved ? JSON.parse(saved) : {};
});
const [pausedTimers, setPausedTimers] = useState(() => {
  const saved = localStorage.getItem('pausedTimers');
  return saved ? JSON.parse(saved) : {};
});
const [timerMode, setTimerMode] = useState(() => {
  const saved = localStorage.getItem('timerMode');
  return saved || 'una_tarea';
});

// Asistente IA
const [assistantConfig, setAssistantConfig] = useState({...});
const [messages, setMessages] = useState([]);

// Configuración de voz
const [voiceEnabled, setVoiceEnabled] = useState(false);
const [selectedVoice, setSelectedVoice] = useState(null);
const [voiceSpeed, setVoiceSpeed] = useState(1.1);
```

### Persistencia de Datos
```javascript
// LocalStorage para estados temporales
useEffect(() => {
  localStorage.setItem('activeTimers', JSON.stringify(activeTimers));
}, [activeTimers]);

useEffect(() => {
  localStorage.setItem('pausedTimers', JSON.stringify(pausedTimers));
}, [pausedTimers]);

useEffect(() => {
  localStorage.setItem('timerMode', timerMode);
}, [timerMode]);
```

---

## ⏰ Sistema de Timers

### Arquitectura del Timer
```javascript
// 1. Iniciar Timer
const startTimer = (taskId) => {
  const activeTimerIds = Object.keys(activeTimers);

  // Verificar modo de timer
  if (timerMode === 'una_tarea' && activeTimerIds.length > 0) {
    // Lógica de confirmación para pausar timer actual
    if (confirm(`Tienes una tarea en curso. ¿Pausar...?`)) {
      activeTimerIds.forEach(id => pauseTimer(id));
    } else {
      return;
    }
  }

  const startTime = Date.now();
  setActiveTimers(prev => ({ ...prev, [taskId]: startTime }));

  // Crear intervalo para actualización en tiempo real
  const intervalId = setInterval(() => {
    setActiveTimers(prev => ({ ...prev, [taskId]: startTime }));
  }, 1000);

  setTimerIntervals(prev => ({ ...prev, [taskId]: intervalId }));
};
```

### Cálculo de Tiempo
```javascript
const getTimerDisplay = (taskId) => {
  const startTime = activeTimers[taskId];
  const pausedTime = pausedTimers[taskId] || 0;

  let totalElapsed = pausedTime;

  if (startTime) {
    totalElapsed += (Date.now() - startTime);
  }

  const hours = Math.floor(totalElapsed / (1000 * 60 * 60));
  const minutes = Math.floor((totalElapsed % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalElapsed % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
```

### Modos de Timer
- **🎯 Una tarea a la vez**: Pausa automáticamente otras tareas
- **🔄 Varias tareas a la vez**: Permite múltiples timers con confirmación

---

## 🔐 Sistema de Autenticación

### JWT Authentication
```javascript
// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};
```

### Hook de Autenticación
```javascript
// useAuth.js
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
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
      return { success: false, error: await response.text() };
    }
  };

  return { user, loading, login, logout, register };
};
```

---

## ⚙️ Configuración y Personalización

### Configuración del Asistente IA
```javascript
const assistantConfig = {
  basePrompt: "Eres mi asistente coach personal...",
  systemPrompt: "Eres mi asistente coach personal...",
  userName: "Elisa",
  assistantName: "Elon Musk",
  specialties: ["Desarrollo de Software"],
  tone: "Motivador",
  focusAreas: {
    proyectos: true,
    tareas: true,
    aprendizaje: false,
    habitos: false
  },
  memory: {
    personalityTraits: "",
    motivationalTriggers: "",
    challengesAndStruggles: "",
    goalsAndAspirations: "",
    workingStyle: "",
    currentFocus: ""
  }
};
```

### Configuración de Voz
```javascript
const voiceConfig = {
  voiceEnabled: false,
  selectedVoice: null,
  voiceSpeed: 1.1,
  availableVoices: [] // Cargado dinámicamente
};
```

### Temas y Estilos
```css
/* Tema Retro-Futurista Synthwave */
.neon-border {
  border-bottom: 2px solid #ff00ff;
  background: linear-gradient(45deg, rgba(255, 0, 255, 0.1), rgba(0, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  animation: synthPulse 3s ease-in-out infinite;
}

@keyframes synthPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
  }
}
```

---

## 💻 Comandos de Desarrollo

### Scripts Disponibles
```bash
# Desarrollo
npm run dev          # Inicia Vite dev server (puerto 5173)
npm run server       # Inicia Express server (puerto 3001)
npm run dev:full     # Build + Start server

# Producción
npm run build        # Build para producción
npm run preview      # Preview del build
npm run prod         # Build + Start
npm start           # Alias para npm run server
```

### Configuración de Desarrollo
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

### Variables de Entorno
```javascript
// server.js
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-key';
```

---

## 🚀 Mejoras Futuras

### Funcionalidades Pendientes
1. **📱 Mobile App**: React Native o PWA
2. **☁️ Cloud Sync**: Sincronización en la nube
3. **👥 Colaboración**: Proyectos compartidos
4. **📊 Analytics Avanzados**: Dashboards de productividad
5. **🔔 Notificaciones**: Push notifications
6. **📅 Calendario**: Integración con Google Calendar
7. **🎯 Gamificación**: Sistema de logros y puntos
8. **🔄 Integrations**: Slack, Trello, GitHub, etc.
9. **🎨 Temas Personalizables**: Más opciones de UI
10. **🤖 IA Avanzada**: Sugerencias automáticas

### Optimizaciones Técnicas
1. **⚡ Performance**: Code splitting, lazy loading
2. **🔧 Testing**: Unit tests, E2E tests
3. **📦 Bundle Size**: Optimización de dependencias
4. **🛡️ Security**: Rate limiting, input validation
5. **📱 PWA**: Service workers, offline mode
6. **🔍 SEO**: Meta tags, structured data
7. **♿ Accessibility**: ARIA, keyboard navigation
8. **🌍 i18n**: Internacionalización

---

## 🎯 Conclusión

Este sistema es una aplicación completa de gestión de productividad con características avanzadas como:

- ✅ **Timer inteligente** con persistencia y modos de trabajo
- 🤖 **IA integrada** para coaching personal
- 🎨 **UI moderna** con tema retro-futurista
- 🔐 **Autenticación segura** con JWT
- 📊 **Tracking de tiempo** y métricas
- 🎤 **Interfaz de voz** (texto a voz y reconocimiento)
- 📱 **Responsive design** para todos los dispositivos

El código está bien estructurado, documentado y listo para escalabilidad futura. ¡Es una base sólida para seguir construyendo características increíbles! 🚀

---

**¡Felicidades por crear una aplicación tan completa y profesional!** 🎉