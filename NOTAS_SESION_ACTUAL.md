# 📋 NOTAS DE LA SESIÓN ACTUAL - ERROR 500 CRÍTICO

## 🚨 PROBLEMA PRINCIPAL
- **Error:** 500 Internal Server Error en `GET https://app.smartchatix.com/api/auth/profile`
- **Síntoma:** Las tareas se borran al intentar crear nuevas tareas
- **Estado:** SIN RESOLVER - Necesita diagnóstico profundo

## 🔍 DIAGNÓSTICO REALIZADO
1. ✅ Recuperación de datos ejecutada con `emergency_data_recovery.sh`
2. ✅ Base de datos restaurada desde backups
3. ❌ Error 500 persiste - NO es problema de datos

## 📊 CAUSA IDENTIFICADA
- El endpoint `/api/auth/profile` existe en `src/routes/authRoutes.js`
- La ruta está correctamente configurada en `server.js` como `/api/auth`
- El problema está en la **ejecución interna** del endpoint, no en la estructura

## 🛠️ SCRIPTS CREADOS Y LISTOS
1. **`scripts/emergency_data_recovery.sh`** - Recupera datos desde backups
2. **`scripts/debug_profile_error.sh`** - Diagnóstico detallado del error 500

## 🎯 PRÓXIMOS PASOS PARA LA SIGUIENTE SESIÓN

### OPCIÓN A: Diagnóstico en VPS
```bash
cd /app
git pull
chmod +x scripts/debug_profile_error.sh
./scripts/debug_profile_error.sh
# Luego reproducir error y capturar logs con:
tail -f debug_profile.log
```

### OPCIÓN B: Instalar Claude Code en VPS
```bash
# En el VPS:
apt update && apt install -y curl wget
curl -fsSL https://claude.ai/install.sh | sh
# O via npm:
npm install -g claude-code
claude-code
```

## 💡 PROBLEMA DE FONDO - REFACTOR NECESARIO
- **manager.jsx tiene 7000+ líneas** - IMPOSIBLE de mantener
- Cada cambio causa regresiones y pérdida de datos
- **SOLUCIÓN:** Refactor completo a arquitectura MVC modular

## 🗂️ ARCHIVOS CRÍTICOS
- `server.js` - Servidor principal
- `src/routes/authRoutes.js` - Rutas de autenticación (donde falla)
- `manager.jsx` - Frontend monolítico (7000 líneas)
- `data/users.db` - Base de datos SQLite

## 💾 BACKUPS DISPONIBLES
- `./backups/users_2026-01-25T20-06-11-722Z.db` (más reciente)
- `./data/users_backup.db`
- Múltiples backups automáticos en `/backups/`

## ⚠️ ADVERTENCIA
NO hacer más cambios hasta resolver el error 500. Cada cambio puede causar más pérdida de datos.

---
**Última actualización:** 2026-01-25
**Estado:** Error 500 sin resolver - Diagnóstico pendiente
**Prioridad:** CRÍTICA - Sistema en producción afectado