#!/bin/bash

# Script para subir solo la base de datos a producción
# Usar cuando necesites actualizar la BD sin tocar el código

set -e

echo "🚀 SUBIENDO BASE DE DATOS A PRODUCCIÓN"
echo "=================================================="

# Verificar que la base de datos local existe
if [ ! -f "data/users.db" ]; then
    echo "❌ Error: No se encuentra data/users.db"
    exit 1
fi

# Variables de producción (configura estas en .env)
PRODUCTION_HOST="${PRODUCTION_HOST:-your-server.com}"
PRODUCTION_USER="${PRODUCTION_USER:-root}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/var/www/project_manager}"

echo "📤 Subiendo base de datos..."
echo "Servidor: $PRODUCTION_HOST"
echo "Ruta: $PRODUCTION_PATH"

# Crear backup en producción antes de subir
echo "🔄 Creando backup de la BD actual en producción..."
ssh $PRODUCTION_USER@$PRODUCTION_HOST "
    cd $PRODUCTION_PATH
    mkdir -p data/backups
    if [ -f data/users.db ]; then
        timestamp=\$(date +%Y-%m-%d_%H-%M-%S)
        cp data/users.db data/backups/users_before_upload_\${timestamp}.db
        echo '✅ Backup creado: users_before_upload_\${timestamp}.db'
    else
        echo '⚠️  No hay BD previa en producción'
    fi
"

# Subir la nueva base de datos
echo "📤 Transfiriendo base de datos..."
scp data/users.db $PRODUCTION_USER@$PRODUCTION_HOST:$PRODUCTION_PATH/data/

# Verificar que se subió correctamente
ssh $PRODUCTION_USER@$PRODUCTION_HOST "
    cd $PRODUCTION_PATH
    if [ -f data/users.db ]; then
        size=\$(stat -c%s data/users.db)
        echo '✅ Base de datos subida exitosamente (tamaño: \$size bytes)'

        # Verificar permisos
        chmod 644 data/users.db
        echo '✅ Permisos configurados'
    else
        echo '❌ Error: La base de datos no se subió correctamente'
        exit 1
    fi
"

echo "=================================================="
echo "🎉 BASE DE DATOS SUBIDA EXITOSAMENTE"
echo "✅ Tu aplicación debería funcionar ahora"