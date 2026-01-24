# 🤖 CONTEXTO PARA CLAUDE CODE

## 📋 INSTRUCCIONES PARA EL ASISTENTE

**Al iniciar cualquier sesión en este proyecto:**

1. **🧠 LEE PRIMERO**: `DEV_MEMORY.md` - Contiene TODO el conocimiento acumulado
2. **🔍 REVISA**: Los errores ya resueltos y patrones exitosos
3. **⚠️ NUNCA**: Repitas errores documentados en DEV_MEMORY.md

## 🎯 INFORMACIÓN RÁPIDA

- **Aplicación**: SmartChatix (Project Manager comercial)
- **Usuarios**: REALES en producción
- **URLs**: NUNCA hardcodear - usar `getApiBase()`
- **Deploy**: NUNCA git push directo - usar `./scripts/safe_deploy.sh`

## 🛡️ REGLAS DE ORO

1. **Antes de cambiar código**: Lee DEV_MEMORY.md
2. **URLs dinámicas**: Siempre `getApiBase()`
3. **Deploy seguro**: Scripts de backup obligatorio
4. **Tests**: Verificar funciones críticas

## 📚 ARCHIVOS CLAVE

- `DEV_MEMORY.md` - Conocimiento acumulado
- `manager.jsx` - Frontend principal (7000+ líneas)
- `server.js` - Backend principal
- `.env` - Configuración crítica

---

**🎯 OBJETIVO**: Evitar que cada sesión sea un "nuevo aprendiz" - usar el conocimiento acumulado