# 🧠 MEMORIA DEL DESARROLLADOR - SMARTCHATIX

## 📊 INFORMACIÓN CRÍTICA DEL PROYECTO

### 🎯 **QUÉ ES ESTA APLICACIÓN**
- **Nombre**: SmartChatix - Project Manager con IA
- **Tipo**: Aplicación web comercial para gestión de proyectos
- **URL Producción**: https://app.smartchatix.com
- **Estado**: EN PRODUCCIÓN CON USUARIOS REALES

### 🚨 **REGLAS ABSOLUTAS - NUNCA ROMPER**

1. **❌ JAMÁS usar URLs hardcodeadas como `http://localhost:3001`**
   - ✅ SIEMPRE usar: `getApiBase()`
   - 📍 Ubicación: manager.jsx líneas ~700-710

2. **🔒 PROTECCIÓN DE DATOS ES SAGRADA**
   - Base de datos: `users.db` (SQLite)
   - NUNCA hacer cambios sin backup
   - SIEMPRE usar: `./scripts/safe_deploy.sh`

3. **🎯 FUNCIONES CRÍTICAS QUE NO PUEDEN FALLAR**
   - `handlePasteImage` - Pegar imágenes con Ctrl+V
   - `sendAssistantMessage` - Chat con IA
   - `authenticatedFetch` - Todas las API calls
   - `getApiBase` - URLs dinámicas

## 🏗️ **ARQUITECTURA ACTUAL**

### Frontend (React + Vite)
```
- manager.jsx (ARCHIVO PRINCIPAL - 7000+ líneas)
- src/main.jsx (Entry point)
- Puerto: 5173 (dev)
```

### Backend (Node.js + Express)
```
- server.js (ARCHIVO PRINCIPAL)
- Puerto: 3001
- Base de datos: users.db (SQLite)
- Backup automático cada 4 horas
```

### 🔗 **ENDPOINTS CRÍTICOS**
```
/api/auth/* - Autenticación (Google OAuth)
/api/assistant/response - Chat con IA
/upload.php - Subida de archivos
/uploads/* - Servir imágenes
```

## ⚙️ **CONFIGURACIÓN CRÍTICA**

### Variables de Entorno (.env)
```bash
# IA
OPENAI_API_KEY="sk-proj-..." # Para backend
VITE_OPENAI_API_KEY="sk-proj-..." # Para frontend (legacy)
GEMINI_API_KEY="AIza..." # Google Gemini

# OAuth
GOOGLE_CLIENT_ID="402733488601-..."
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# Producción (para despliegue seguro)
PRODUCTION_HOST=tu-servidor.com
PRODUCTION_USER=root
PRODUCTION_PATH=/var/www/project_manager
```

### 📱 **URLs Dinámicas (getApiBase)**
```javascript
// EN DESARROLLO
getApiBase() → "http://localhost:3001"

// EN PRODUCCIÓN
getApiBase() → "https://app.smartchatix.com"
```

## 🔧 **PROBLEMAS RESUELTOS RECIENTES**

### ✅ **Sesión Actual (24/01/2026)**

1. **PROBLEMA**: Asistente no funcionaba por CORS
   - **CAUSA**: Frontend llamaba directo a OpenAI
   - **SOLUCIÓN**: Cambiar a `/api/assistant/response`
   - **ARCHIVO**: manager.jsx línea ~2700

2. **PROBLEMA**: Pegar imágenes roto
   - **CAUSA**: URLs hardcodeadas agregadas en último commit
   - **SOLUCIÓN**: Cambiar por `getApiBase()`
   - **ARCHIVO**: manager.jsx línea ~3493

3. **PROBLEMA**: Pérdida de datos en producción
   - **SOLUCIÓN**: Sistema completo de backup y protección
   - **ARCHIVOS**: `scripts/safe_deploy.sh`, `scripts/production_backup.js`

## 🛡️ **SISTEMA DE PROTECCIÓN IMPLEMENTADO**

### Pre-commit Hooks
```bash
.husky/pre-commit # Bloquea URLs hardcodeadas
```

### Scripts de Seguridad
```bash
./scripts/safe_deploy.sh # Despliegue con backup
./scripts/validate_deployment.sh # Validar producción
```

### Tests Críticos
```bash
tests/critical-features.test.js # Evita regresiones
```

## 📋 **WORKFLOW CORRECTO**

### Para nuevas funciones:
```bash
1. Leer esta memoria PRIMERO
2. Usar getApiBase() para URLs
3. Probar en local
4. Ejecutar tests: npm run test:critical
5. Commit (pre-commit se ejecuta automático)
```

### Para desplegar:
```bash
1. ./scripts/safe_deploy.sh (NUNCA git push directo)
2. ./scripts/validate_deployment.sh https://app.smartchatix.com
```

## 🎯 **FUNCIONALIDADES PRINCIPALES**

### 1. **Gestión de Tareas**
- CRUD completo de tareas
- Drag & drop para reordenar
- Estados: pending, in_progress, completed
- Archivado automático

### 2. **Editor WYSIWYG Inline**
- Edición directa en las tareas
- Soporte para imágenes con Ctrl+V
- Markdown y HTML

### 3. **Asistente IA**
- Chat con OpenAI/Gemini
- Funciones específicas del proyecto
- Historial de conversaciones

### 4. **Autenticación**
- Google OAuth
- JWT tokens
- Sesiones persistentes

### 5. **Gestión de Archivos**
- Upload vía drag & drop
- Paste de imágenes desde clipboard
- Galería automática

## 🚨 **ERRORES COMUNES A EVITAR**

1. **❌ URLs hardcodeadas**
   ```javascript
   // MAL
   fetch('http://localhost:3001/api/...')

   // BIEN
   fetch(`${getApiBase()}/api/...`)
   ```

2. **❌ Modificar funciones críticas sin tests**
   - Siempre verificar que existan después de cambios

3. **❌ Desplegar sin backup**
   - NUNCA hacer `git push` directo a producción
   - SIEMPRE usar `./scripts/safe_deploy.sh`

4. **❌ Exponer API keys**
   - Revisar que no estén en código
   - Usar variables de entorno

## 📚 **CONOCIMIENTO ACUMULADO**

### Lessons Learned:
1. **URLs dinámicas son críticas** - Rompieron imagen paste
2. **Backup es vital** - Se perdieron datos antes
3. **Pre-commit hooks salvan vidas** - Previenen errores
4. **Tests automáticos necesarios** - Para aplicación comercial

### Patterns Exitosos:
1. `getApiBase()` para toda URL
2. `authenticatedFetch()` para APIs
3. Pre-commit validation
4. Backup antes de deploy

---

## 🔄 **ACTUALIZAR ESTA MEMORIA**

**IMPORTANTE**: Cada sesión que resuelva problemas importantes debe actualizar esta memoria:

```bash
# Al final de cada sesión relevante
echo "- Nueva lección aprendida" >> DEV_MEMORY.md
git add DEV_MEMORY.md
git commit -m "Update dev memory with session learnings"
```

---

**📅 Última actualización**: 24/01/2026
**🧠 Sesiones acumuladas**: 1
**🎯 Próxima prioridad**: Mantener estabilidad y agregar nuevas features sin romper existentes