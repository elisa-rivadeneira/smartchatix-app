#!/bin/bash

# Script temporal para subir la base de datos vía Git
# NO RECOMENDADO para producción real, pero funcional para casos específicos

echo "⚠️  SUBIDA TEMPORAL DE BASE DE DATOS VÍA GIT"
echo "=================================================="
echo "ADVERTENCIA: Esto subirá datos de usuarios al repositorio"
echo "Solo usar si es tu servidor privado y no hay datos sensibles"
echo

read -p "¿Continuar? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Operación cancelada"
    exit 1
fi

# Crear una copia temporal para subir
cp data/users.db data/users_temp_upload.db

# Agregar temporalmente al git
git add data/users_temp_upload.db

# Commit y push
git commit -m "Temporal: Add database for deployment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main

echo "✅ Base de datos subida temporalmente"
echo "🔄 Ahora ve a tu servidor y:"
echo "   1. Renombra users_temp_upload.db a users.db"
echo "   2. Reinicia tu aplicación"
echo
echo "⚠️  IMPORTANTE: Eliminar el archivo temporal del repo después:"
echo "   git rm data/users_temp_upload.db"
echo "   git commit -m 'Remove temporary database file'"
echo "   git push origin main"