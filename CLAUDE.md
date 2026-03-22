# 🛡️ PROTECCIÓN TOTAL DE DATOS

## 🚀 VOLUMEN PERSISTENTE CONFIGURADO

Los datos están ahora **100% SEGUROS** con volumen persistente en `/data`.

**⚠️ IMPORTANTE**: EasyPanel debe tener configurado:
- ✅ **Volumen persistente**: `/data` → `/data`
- ✅ **Puerto del contenedor**: 3001
- ✅ **Variable de entorno**: `NODE_ENV=production`

## 🧠 **LEE PRIMERO**: DEV_MEMORY.md
**IMPORTANTE**: Antes de hacer CUALQUIER cambio, lee `DEV_MEMORY.md` - contiene toda la información crítica y errores ya resueltos.

## 🚀 Despliegue Súper Seguro

**SIEMPRE usa el script optimizado:**

```bash
# Despliegue con volumen persistente (más seguro)
./scripts/safe_deploy.sh
```

Este script hace:
1. ✅ Commit automático si hay cambios
2. ✅ Push al repositorio de GitHub
3. ✅ EasyPanel hace pull automáticamente
4. ✅ Los datos en `/data` NUNCA se tocan
5. ✅ Verificación del estado final

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

## 🔧 Configuración EasyPanel

**CRÍTICO**: Para que funcione correctamente:

1. **Volumen persistente**: `/data` → `/data`
2. **Puerto del contenedor**: `3001`
3. **Variable de entorno**: `NODE_ENV=production`
4. **Auto-deploy**: Conectado a GitHub (rama main)

## 🛡️ Sistema de Protección

Con volumen persistente configurado:
- ✅ **Base de datos**: Protegida en `/data/users.db` (NUNCA se perderá)
- ✅ **Uploads**: Protegidos en `/data/uploads/`
- ✅ **Deploy seguro**: Solo se actualiza código, no datos
- ✅ **Auto-backup**: Disponible con scripts de backup
- ✅ **Rollback**: Si algo falla, solo afecta al código

## ⚡ Ventajas del Volumen Persistente

1. **Datos permanentes**: Sobreviven a redeploys, reinicios, crashes
2. **Deploy más rápido**: No necesita backup/restore manual
3. **Cero downtime**: EasyPanel actualiza solo el código
4. **Recuperación simple**: Si algo falla, los datos siguen ahí