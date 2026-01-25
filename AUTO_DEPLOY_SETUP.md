# 🚀 AUTO-DEPLOY AUTOMÁTICO Y SEGURO

## 🎯 **LO QUE LOGRARÁS:**

✅ **Haces commit → Automáticamente se despliega sin tocar la DB**
✅ **Backup automático antes de cada deploy**
✅ **Base de datos 100% protegida**
✅ **Rollback automático si algo falla**

## ⚙️ **CONFIGURACIÓN DE 5 MINUTOS:**

### 1. **Configurar GitHub Secrets**

Ve a tu repo: `https://github.com/elisa-rivadeneira/smartchatix-app/settings/secrets/actions`

Agrega estos secrets:

```
PRODUCTION_HOST = tu-servidor.com
PRODUCTION_USER = root (o tu usuario)
PRODUCTION_PATH = /var/www/project_manager (o tu ruta)
SSH_PRIVATE_KEY = [tu clave SSH privada]
```

### 2. **Generar clave SSH (si no tienes):**

```bash
# En tu máquina local
ssh-keygen -t rsa -b 4096 -f ~/.ssh/smartchatix_deploy

# Copiar clave pública al servidor
ssh-copy-id -i ~/.ssh/smartchatix_deploy.pub usuario@tu-servidor.com

# Copiar clave PRIVADA a GitHub Secrets
cat ~/.ssh/smartchatix_deploy
```

### 3. **Crear directorio de backups en servidor:**

```bash
# En tu servidor
ssh usuario@tu-servidor.com
cd /var/www/project_manager
mkdir -p backups
chmod 755 backups
```

## 🛡️ **CÓMO PROTEGE TU BASE DE DATOS:**

### El workflow automático hace:

1. **💾 Backup**: Copia `users.db` → `backups/auto_deploy_FECHA.db`
2. **🔒 Proteger**: Mueve `users.db` → `users.db.PROTECTED`
3. **📥 Git Pull**: Actualiza código (DB protegida)
4. **🔓 Restaurar**: `users.db.PROTECTED` → `users.db`
5. **🔍 Verificar**: Confirma que DB existe y no está vacía
6. **🚨 Rollback**: Si algo falla, restaura desde backup

### Verificaciones automáticas:
- ❌ **URLs hardcodeadas** → Bloquea deploy
- ❌ **Funciones críticas faltantes** → Bloquea deploy
- ❌ **DB vacía después de deploy** → Restaura backup
- ❌ **Archivos críticos faltantes** → Rollback

## 🚀 **USO SÚPER SIMPLE:**

```bash
# En tu máquina local
git add .
git commit -m "Mi cambio"
git push

# ¡YA ESTÁ! GitHub automáticamente:
# 1. Hace backup de tu DB
# 2. Despliega los cambios
# 3. Protege la DB
# 4. Verifica que todo funciona
# 5. Te notifica el resultado
```

## 📊 **LOGS Y MONITOREO:**

- Ve el progreso en: `https://github.com/elisa-rivadeneira/smartchatix-app/actions`
- Si falla algo, verás exactamente qué y por qué
- Logs detallados de cada paso

## 🔥 **CARACTERÍSTICAS PRO:**

- **🔄 Reinicio automático** de la app (PM2/systemctl)
- **🧹 Limpieza automática** de backups antiguos
- **📱 Notificaciones** de éxito/fallo
- **⚡ Deploy en menos de 2 minutos**
- **🛡️ Zero downtime** con protección total

## 🚨 **SI ALGO SALE MAL:**

El sistema es **fail-safe**:
- Si falla el deploy → Restaura todo automáticamente
- Si la DB se daña → Usa el backup del minuto anterior
- Si falta algún archivo → Revierte cambios

---

**🎯 RESULTADO: Commit → Push → Producción actualizada SIN RIESGOS**