# 🛡️ PROTECCIÓN DE DATOS DE PRODUCCIÓN

## ⚠️ NUNCA MÁS SE PERDERÁN DATOS

Este proyecto ahora tiene un sistema completo de protección de datos para evitar pérdidas en producción.

## 🧠 **LEE PRIMERO**: DEV_MEMORY.md
**IMPORTANTE**: Antes de hacer CUALQUIER cambio, lee `DEV_MEMORY.md` - contiene toda la información crítica y errores ya resueltos.

## 🚀 Despliegue Seguro

**SIEMPRE usa el script de despliegue seguro:**

```bash
# Despliegue automático con protección total
./scripts/safe_deploy.sh
```

Este script hace:
1. ✅ Backup automático ANTES de cualquier cambio
2. ✅ Verifica que el código está committeado
3. ✅ Protege la base de datos durante el pull
4. ✅ Restaura automáticamente si algo sale mal
5. ✅ Verifica que todo funciona después

## 📋 Comandos Importantes

```bash
# Crear backup de producción
node scripts/production_backup.js create

# Listar backups disponibles
node scripts/production_backup.js list

# Despliegue seguro completo
./scripts/safe_deploy.sh

# Verificar servidores locales
npm run dev  # Frontend: http://localhost:5173
node server.js  # Backend: http://localhost:3001
```

## 🔧 Configuración Requerida

1. Copia `.env.example` a `.env`
2. Configura tus datos de producción:
   - PRODUCTION_HOST
   - PRODUCTION_USER
   - PRODUCTION_PATH
   - PRODUCTION_DB_PATH

## 🛡️ Sistema de Protección

- **Backup automático**: Antes de cada despliegue
- **Protección de DB**: La base de datos NUNCA se sobrescribe
- **Verificación post-despliegue**: Confirma que todo funciona
- **Rollback automático**: Si algo falla, se restaura
- **Múltiples backups**: Local y remoto para máxima seguridad