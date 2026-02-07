#!/bin/bash

# 🚀 DESPLIEGUE LOCAL (cuando ya estás en producción)
# Para usar cuando ya estás en el servidor/contenedor de producción

set -e  # Salir inmediatamente si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 INICIANDO DESPLIEGUE LOCAL${NC}"
echo "=================================================="

# 1. BACKUP OBLIGATORIO
echo -e "${YELLOW}📋 Paso 1: Backup de seguridad${NC}"
node local_backup.js create

if [ $? -ne 0 ]; then
    echo -e "${RED}💥 FALLO CRÍTICO: No se pudo crear backup${NC}"
    echo -e "${RED}❌ DESPLIEGUE CANCELADO POR SEGURIDAD${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backup completado exitosamente${NC}"

# 2. Verificar que los cambios están committeados (si hay git)
echo -e "${YELLOW}📋 Paso 2: Verificando estado del repositorio${NC}"
if [ -d .git ]; then
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️ Hay cambios sin commit (continuando de todas formas)${NC}"
        git status
    else
        echo -e "${GREEN}✅ Repositorio limpio${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ No es un repositorio git${NC}"
fi

# 3. Actualizar código
echo -e "${YELLOW}📋 Paso 3: Actualizando código${NC}"

# Proteger la base de datos antes del pull
if [ -f /app/data/users.db ]; then
    cp /app/data/users.db /app/data/users.db.pre_pull_backup
    echo -e "${GREEN}🔒 DB respaldada antes del pull${NC}"
fi

# Pull de cambios
if [ -d .git ]; then
    git pull origin main
    echo -e "${GREEN}✅ Código actualizado${NC}"
else
    echo -e "${YELLOW}⚠️ No es un repositorio git, saltando pull${NC}"
fi

# Restaurar DB si fue sobrescrita
if [ -f /app/data/users.db.pre_pull_backup ]; then
    if [ ! -f /app/data/users.db ] || [ $(stat -c%s /app/data/users.db) -eq 0 ]; then
        echo -e "${YELLOW}🚨 DB fue borrada o está vacía, restaurando...${NC}"
        mv /app/data/users.db.pre_pull_backup /app/data/users.db
        echo -e "${GREEN}✅ DB restaurada exitosamente${NC}"
    else
        echo -e "${GREEN}✅ DB preservada correctamente${NC}"
        rm /app/data/users.db.pre_pull_backup
    fi
fi

# 4. Aplicar migraciones de BD
echo -e "${YELLOW}📋 Paso 4: Aplicando migraciones de base de datos${NC}"
if [ -f scripts/fix_schema_with_node.js ]; then
    node scripts/fix_schema_with_node.js
    echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
else
    echo -e "${YELLOW}⚠️ Script de migración no encontrado${NC}"
fi

# 5. Instalar dependencias
echo -e "${YELLOW}📋 Paso 5: Instalando dependencias${NC}"
if [ -f package.json ]; then
    npm install --production
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${YELLOW}⚠️ package.json no encontrado${NC}"
fi

# 6. Verificación final
echo -e "${YELLOW}📋 Paso 6: Verificación final${NC}"

# Verificar que la DB existe y no está vacía
if [ -f /app/data/users.db ]; then
    size=$(stat -c%s /app/data/users.db)
    if [ $size -gt 0 ]; then
        echo -e "${GREEN}✅ Base de datos OK (tamaño: $size bytes)${NC}"
    else
        echo -e "${RED}❌ Base de datos está vacía${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Base de datos no encontrada${NC}"
    exit 1
fi

# Verificar archivos principales
if [ -f server.js ]; then
    echo -e "${GREEN}✅ server.js presente${NC}"
else
    echo -e "${RED}❌ server.js falta${NC}"
    exit 1
fi

echo "=================================================="
echo -e "${GREEN}🎉 DESPLIEGUE LOCAL COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}✅ Datos preservados y verificados${NC}"
echo -e "${GREEN}✅ Backup creado${NC}"
echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
echo -e "${GREEN}✅ Sistema actualizado${NC}"
echo "=================================================="
echo -e "${YELLOW}📋 PRÓXIMOS PASOS:${NC}"
echo "1. Reinicia tu aplicación (pm2 restart app o docker restart)"
echo "2. Prueba que todo funciona correctamente"