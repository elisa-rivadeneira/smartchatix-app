# 🚀 EasyPanel Auto-Deploy Workflow

## 📋 Flujo para EasyPanel con auto-deploy

Como EasyPanel hace deploy automático al hacer push, necesitamos un flujo especial:

### 🛡️ 1. ANTES del Push (desde desarrollo)

```bash
# Hacer backup de producción ANTES del push
node scripts/pre_deploy_backup.js

# Si todo OK, hacer push (EasyPanel auto-deploys)
git add .
git commit -m "Fix importante"
git push origin main
```

### 🔧 2. DESPUÉS del Auto-Deploy (en contenedor)

```bash
# SSH al contenedor de EasyPanel
# Ejecutar setup post-deploy
cd /app/scripts
node post_deploy_setup.js
```

### 🚨 3. Si algo sale mal (recuperación)

```bash
# Ver backups disponibles
node scripts/restore_backup.js list

# Restaurar último backup
node scripts/restore_backup.js restore
```

## 📁 Scripts disponibles:

### Para desarrollo (local):
- `pre_deploy_backup.js` - Backup antes de push
- `restore_backup.js` - Restaurar si algo falla

### Para producción (contenedor):
- `post_deploy_setup.js` - Setup después de auto-deploy
- `fix_schema_with_node.js` - Migraciones de BD

## ⚙️ Variables de entorno requeridas (desarrollo):

```bash
# En tu .env local para conectar a producción
PRODUCTION_HOST=tu-servidor.com
PRODUCTION_USER=root
PRODUCTION_PATH=/app
PRODUCTION_DB_PATH=/app/data/users.db
```

## 🔄 Flujo completo ejemplo:

```bash
# 1. Hacer cambios en código
vim src/routes/authRoutes.js

# 2. Backup pre-deploy
node scripts/pre_deploy_backup.js

# 3. Push (auto-deploy)
git add . && git commit -m "Fix endpoint" && git push

# 4. En EasyPanel container:
node scripts/post_deploy_setup.js

# 5. Si hay problemas:
node scripts/restore_backup.js restore
```

## ✅ Ventajas de este flujo:

- ✅ Backup automático antes de cada deploy
- ✅ Compatible con EasyPanel auto-deploy
- ✅ Rollback rápido si algo falla
- ✅ Migraciones automáticas post-deploy
- ✅ Sin interrupciones de servicio