# 🚀 Smartchatix Project Manager

<div align="center">

![Smartchatix Logo](https://img.shields.io/badge/Smartchatix-v2.18-ff00ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjZmYwMGZmIi8+Cjwvc3ZnPgo=)
![Version](https://img.shields.io/badge/Version-2.18-00ffff?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-00ff00?style=for-the-badge)
![Cloud](https://img.shields.io/badge/Cloud-Synchronized-ffff00?style=for-the-badge)

**Una aplicación completa de gestión de proyectos y productividad personal con IA integrada**

*Diseño retro-futurista synthwave de los años 80 • Timer inteligente • Asistente IA • Sincronización en la nube*

[🌐 Demo Live](#demo) • [📖 Documentación](#documentación) • [🚀 Instalación](#instalación) • [💡 Características](#características)

</div>

---

## 🎯 Visión General

**Smartchatix Project Manager** es una aplicación de productividad personal avanzada que combina gestión de proyectos, tracking de tiempo inteligente y un asistente IA personal. Con un diseño retro-futurista inspirado en el synthwave de los 80s, ofrece una experiencia única y moderna.

### ✨ **Características Principales**

<table>
<tr>
<td width="33%">

#### 🏗️ **Gestión de Proyectos**
- Proyectos con estados y prioridades
- Tareas anidadas con progreso
- Métricas de tiempo real
- Deadlines y estimaciones

</td>
<td width="33%">

#### ⏱️ **Timer Inteligente**
- Persistencia a través de recargas
- Modo focus vs multitasking
- Cronómetro en tiempo real
- Historial de tiempos

</td>
<td width="33%">

#### 🤖 **Asistente IA**
- Coach personal integrado
- Configuración personalizable
- Síntesis y reconocimiento de voz
- Memoria contextual

</td>
</tr>
</table>

---

## 🌟 **¿Por qué Smartchatix?**

| Característica | Descripción |
|---|---|
| 🎨 **UI Única** | Diseño synthwave retro-futurista con efectos neón |
| ⚡ **Performance** | React 18 + Vite para máxima velocidad |
| 🔐 **Seguro** | Autenticación JWT + bcrypt |
| ☁️ **Cloud Ready** | Sincronizado automáticamente en VPS |
| 📱 **Responsive** | Funciona perfectamente en móviles |
| 🎤 **Voz** | Interfaz completa de voz integrada |

---

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn

### 🔧 Setup Local

```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd project_manager

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional)
cp .env.example .env
# Editar .env con tus claves de OpenAI

# Iniciar en desarrollo
npm run dev          # Frontend (puerto 5173)
npm run server       # Backend (puerto 3001)

# O todo junto
npm run dev:full
```

### 🌐 Producción

```bash
# Build optimizado
npm run build

# Iniciar en producción
npm run prod
```

---

## ☁️ **Sincronización en la Nube**

> **✅ Esta aplicación ya está sincronizada y desplegada en VPS**
>
> Los cambios se sincronizan automáticamente mediante Git hooks. Solo necesitas:

```bash
git add .
git commit -m "tu mensaje"
git push origin main
```

**El sistema se actualiza automáticamente en el servidor de producción.**

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Framework moderno
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Styling utilitario
- **Lucide React** - Iconografía
- **React Markdown** - Renderizado de contenido

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web minimalista
- **SQLite3** - Base de datos embebida
- **JWT** - Autenticación stateless
- **bcryptjs** - Hash de contraseñas

### APIs & Servicios
- **OpenAI API** - Inteligencia artificial
- **Web Speech API** - Síntesis de voz
- **SpeechRecognition** - Reconocimiento de voz

---

## 📊 Arquitectura del Sistema

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

## 📁 Estructura del Proyecto

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
    ├── manual.html           # Manual del desarrollador (web)
    └── MANUAL_DESARROLLADOR.md # Manual del desarrollador (markdown)
```

---

## 💻 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia Vite dev server (puerto 5173) |
| `npm run server` | Inicia Express server (puerto 3001) |
| `npm run dev:full` | Build + Start server completo |
| `npm run build` | Build optimizado para producción |
| `npm run preview` | Preview del build |
| `npm run prod` | Build + Start en producción |
| `npm start` | Alias para npm run server |

---

## 🔗 API Endpoints

### Autenticación
```http
POST   /api/auth/register         # Registro de usuario
POST   /api/auth/login            # Iniciar sesión
GET    /api/auth/verify           # Verificar token
GET    /api/auth/profile          # Obtener perfil
PUT    /api/auth/change-password  # Cambiar contraseña
```

### Proyectos
```http
GET    /api/auth/projects         # Listar proyectos
POST   /api/auth/projects         # Crear proyecto
PUT    /api/auth/projects/:id     # Actualizar proyecto
DELETE /api/auth/projects/:id     # Eliminar proyecto
```

### Tareas
```http
POST   /api/auth/daily-tasks      # Crear tarea diaria
DELETE /api/auth/daily-tasks/:id  # Eliminar tarea diaria
GET    /api/auth/project-tasks    # Listar tareas de proyecto
POST   /api/auth/project-tasks    # Crear tarea de proyecto
PUT    /api/auth/project-tasks/:id # Actualizar tarea
DELETE /api/auth/project-tasks/:id # Eliminar tarea
```

### Asistente IA
```http
POST   /api/auth/assistant-config # Guardar configuración del asistente
POST   /api/auth/assistant-chat   # Chat con IA
```

---

## ⏰ Sistema de Timers

### Modos de Trabajo

#### 🎯 **Una tarea a la vez**
- Pausa automáticamente otras tareas
- Ideal para concentración profunda (Deep Work)
- Alertas inteligentes al cambiar de tarea

#### 🔄 **Varias tareas a la vez**
- Permite múltiples timers simultáneos
- Perfecto para multitasking
- Confirmación antes de agregar nuevos timers

### Persistencia
Los timers mantienen su estado incluso al refrescar la página:
- **localStorage**: Guarda estados de timers
- **useEffect**: Restaura timers al cargar
- **Intervalos**: Reanuda conteo automáticamente

---

## 🗄️ Base de Datos

### Esquema Principal

<details>
<summary><strong>👥 users</strong> - Usuarios del sistema</summary>

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
</details>

<details>
<summary><strong>📁 projects</strong> - Proyectos</summary>

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
</details>

<details>
<summary><strong>✅ daily_tasks</strong> - Tareas diarias</summary>

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
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```
</details>

---

## 📖 Documentación

### 📚 **Manual del Desarrollador**

Tenemos documentación completa disponible en dos formatos:

#### 🌐 **Versión Web** (Recomendada)
- **URL**: `/docs/manual.html`
- **Características**: Diseño synthwave, navegación interactiva, responsive
- **Cómo ver**: Abre `file:///ruta/al/proyecto/docs/manual.html` en tu navegador

#### 📄 **Versión Markdown**
- **Archivo**: `MANUAL_DESARROLLADOR.md`
- **Características**: Texto plano, ideal para editores
- **Cómo ver**: Cualquier editor de markdown o GitHub

### 📋 **Contenido del Manual**
- 🎯 Visión general y arquitectura
- 🛠️ Tecnologías utilizadas
- 📁 Estructura de archivos detallada
- ⚡ Funcionalidades principales
- 🗄️ Esquemas de base de datos
- 🔗 Documentación completa de API
- ⏰ Sistema de timers explicado
- 🔐 Autenticación y seguridad
- 💻 Comandos de desarrollo
- 🚀 Roadmap de mejoras futuras

---

## 🎨 Capturas de Pantalla

> *Próximamente se agregarán capturas del diseño synthwave*

---

## 🚀 Roadmap

### 🎯 **Próximas Características**
- [ ] 📱 Aplicación móvil (React Native)
- [ ] 📊 Dashboard de analytics avanzados
- [ ] 🔔 Sistema de notificaciones
- [ ] 📅 Integración con Google Calendar
- [ ] 👥 Colaboración en proyectos
- [ ] 🎯 Sistema de gamificación

### ⚡ **Optimizaciones Técnicas**
- [ ] 🔧 Test coverage completo
- [ ] 📦 Optimización de bundle size
- [ ] 🛡️ Rate limiting y validación
- [ ] 📱 Progressive Web App (PWA)
- [ ] 🌍 Internacionalización (i18n)
- [ ] ♿ Mejoras de accesibilidad

---

## 🤝 Contribución

¿Quieres contribuir? ¡Genial!

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### 📋 **Pautas de Contribución**
- Sigue el estilo de código existente
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación si es necesario
- Mantén el diseño synthwave consistente

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

**Elisa Rivadeneira**
- 💼 Desarrolladora Full Stack
- 🎯 Especialista en productividad personal
- 🤖 Entusiasta de la IA

---

## 🙏 Agradecimientos

- 🎨 Inspiración del diseño: Synthwave y estética retro-futurista de los 80s
- 🤖 OpenAI por la API de inteligencia artificial
- ⚛️ Comunidad de React por las herramientas increíbles
- 🎵 Música synthwave que inspiró el diseño

---

<div align="center">

**⚡ Hecho con energía synthwave y mucho ☕**

[![SmartChatix](https://img.shields.io/badge/Powered%20by-SmartChatix-ff00ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjZmYwMGZmIi8+Cjwvc3ZnPgo=)](https://github.com/tu-usuario/smartchatix)

*🌟 Si te gusta este proyecto, ¡dale una estrella! 🌟*

</div>