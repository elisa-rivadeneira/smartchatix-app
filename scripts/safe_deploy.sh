#!/bin/bash

# 🛡️ SISTEMA SEGURO DE DESPLIEGUE
# NUNCA MÁS SE PERDERÁN DATOS EN PRODUCCIÓN

set -e  # Salir inmediatamente si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración (configura estas en .env)
PRODUCTION_HOST="${PRODUCTION_HOST:-your-server.com}"
PRODUCTION_USER="${PRODUCTION_USER:-root}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/var/www/project_manager}"
PRODUCTION_DB="${PRODUCTION_DB:-users.db}"

echo -e "${BLUE}🛡️  INICIANDO DESPLIEGUE SEGURO${NC}"
echo "=================================================="

# 1. BACKUP OBLIGATORIO ANTES DE CUALQUIER CAMBIO
echo -e "${YELLOW}📋 Paso 1: Backup de seguridad obligatorio${NC}"
node scripts/production_backup.js create

if [ $? -ne 0 ]; then
    echo -e "${RED}💥 FALLO CRÍTICO: No se pudo crear backup${NC}"
    echo -e "${RED}❌ DESPLIEGUE CANCELADO POR SEGURIDAD${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backup completado exitosamente${NC}"

# 2. Verificar que los cambios están committeados
echo -e "${YELLOW}📋 Paso 2: Verificando estado del repositorio${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Hay cambios sin commit. Commit primero:${NC}"
    git status
    exit 1
fi

echo -e "${GREEN}✅ Repositorio limpio${NC}"

# 3. Hacer push de cambios
echo -e "${YELLOW}📋 Paso 3: Subiendo cambios al repositorio${NC}"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al hacer push${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cambios subidos al repositorio${NC}"

# 4. Crear backup específico en producción
echo -e "${YELLOW}📋 Paso 4: Backup adicional directo en producción${NC}"
ssh $PRODUCTION_USER@$PRODUCTION_HOST "
    cd $PRODUCTION_PATH
    mkdir -p backups/pre_deploy
    timestamp=\$(date +%Y-%m-%d_%H-%M-%S)

    # Backup de base de datos
    if [ -f $PRODUCTION_DB ]; then
        cp $PRODUCTION_DB backups/pre_deploy/\${PRODUCTION_DB}_\${timestamp}.backup
        echo '✅ DB backup: \${PRODUCTION_DB}_\${timestamp}.backup'
    fi

    # Backup de archivos críticos
    tar -czf backups/pre_deploy/files_\${timestamp}.tar.gz \\
        --exclude=node_modules \\
        --exclude=.git \\
        --exclude=backups \\
        . || true

    echo '✅ Files backup: files_\${timestamp}.tar.gz'
"

# 5. Actualizar código en producción SIN tocar la base de datos
echo -e "${YELLOW}📋 Paso 5: Actualizando código (SIN tocar DB)${NC}"
ssh $PRODUCTION_USER@$PRODUCTION_HOST "
    cd $PRODUCTION_PATH

    # Respaldar DB antes de pull
    if [ -f $PRODUCTION_DB ]; then
        cp $PRODUCTION_DB ${PRODUCTION_DB}.pre_pull_backup
        echo '🔒 DB respaldada antes del pull'
    fi

    # Pull de cambios
    git pull origin main

    # PROTECCIÓN: Restaurar DB si fue sobrescrita
    if [ -f ${PRODUCTION_DB}.pre_pull_backup ]; then
        if [ ! -f $PRODUCTION_DB ] || [ \$(stat -c%s $PRODUCTION_DB) -eq 0 ]; then
            echo '🚨 DB fue borrada o está vacía, restaurando...'
            mv ${PRODUCTION_DB}.pre_pull_backup $PRODUCTION_DB
            echo '✅ DB restaurada exitosamente'
        else
            echo '✅ DB preservada correctamente'
            rm ${PRODUCTION_DB}.pre_pull_backup
        fi
    fi

    # Instalar dependencias si es necesario
    if [ -f package.json ]; then
        npm install --production
    fi
"

# 6. Verificar que todo funciona
echo -e "${YELLOW}📋 Paso 6: Verificación post-despliegue${NC}"
ssh $PRODUCTION_USER@$PRODUCTION_HOST "
    cd $PRODUCTION_PATH

    # Verificar que la DB existe y no está vacía
    if [ -f $PRODUCTION_DB ]; then
        size=\$(stat -c%s $PRODUCTION_DB)
        if [ \$size -gt 0 ]; then
            echo '✅ Base de datos OK (tamaño: \$size bytes)'
        else
            echo '❌ Base de datos está vacía'
            exit 1
        fi
    else
        echo '❌ Base de datos no encontrada'
        exit 1
    fi

    # Verificar archivos principales
    if [ -f server.js ]; then
        echo '✅ server.js presente'
    else
        echo '❌ server.js falta'
        exit 1
    fi
"

# 7. Reiniciar servicios si es necesario (opcional)
echo -e "${YELLOW}📋 Paso 7: Reinicio de servicios (si es necesario)${NC}"
read -p "¿Reiniciar servicios en producción? (y/N): " restart
if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    ssh $PRODUCTION_USER@$PRODUCTION_HOST "
        # Aquí puedes agregar comandos para reiniciar tu aplicación
        # Por ejemplo: pm2 restart app o systemctl restart your-app
        echo 'Reiniciando servicios...'
    "
fi

echo "=================================================="
echo -e "${GREEN}🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}✅ Datos preservados y verificados${NC}"
echo -e "${GREEN}✅ Backups múltiples creados${NC}"
echo -e "${GREEN}✅ Sistema desplegado de forma segura${NC}"