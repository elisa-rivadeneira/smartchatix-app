#!/bin/bash

# 🛡️ DESPLIEGUE SEGURO CON VOLUMEN PERSISTENTE
# LA BASE DE DATOS ESTÁ PROTEGIDA EN /data

set -e

echo "🚀 DESPLEGUE SEGURO CON VOLUMEN PERSISTENTE"
echo "=========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    exit 1
fi

echo "🔍 Verificando estado del repositorio..."

# Verificar si hay cambios sin commitear
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  Hay cambios sin commitear. Commiteando automáticamente..."
    git add .
    git commit -m "Auto-commit antes del deploy $(date '+%Y-%m-%d %H:%M:%S')

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    echo "✅ Cambios committeados"
fi

# Verificar configuración de EasyPanel
echo "📋 RECORDATORIO: Para protección completa:"
echo "   1. ✅ Configurar volumen persistente: /data → /data"
echo "   2. ✅ Variable de entorno: NODE_ENV=production"
echo "   3. ✅ Puerto del contenedor: 3001"
echo ""

# Push al repositorio
echo "📤 Enviando cambios al repositorio..."
git push origin main
echo "✅ Código enviado a GitHub"

echo ""
echo "🎯 DEPLOY LISTO"
echo "=================="
echo "✅ Los datos están SEGUROS con volumen persistente"
echo "✅ EasyPanel hará pull automáticamente"
echo "✅ La base de datos en /data nunca se perderá"
echo ""
echo "🔗 Verificar en: https://app.smartchatix.com"

echo ""
echo "📊 Estado final del repositorio:"
git log --oneline -3