#!/bin/bash

# 🚨 REPARACIÓN RÁPIDA DE PRODUCCIÓN
# Ejecuta esto para arreglar los problemas más comunes

set -e

echo "🚨 REPARACIÓN RÁPIDA DE PRODUCCIÓN"
echo "=================================================="

# 1. Backup de emergencia (por si acaso)
echo "💾 Creando backup de emergencia..."
mkdir -p emergency_backups
timestamp=$(date +%Y%m%d_%H%M%S)

if [ -f "users.db" ]; then
    cp users.db "emergency_backups/users_emergency_${timestamp}.db"
    echo "✅ Backup: users.db"
fi

if [ -f "data/users.db" ]; then
    cp data/users.db "emergency_backups/data_users_emergency_${timestamp}.db"
    echo "✅ Backup: data/users.db"
fi

# 2. Crear directorio data si no existe
echo ""
echo "📁 Verificando estructura de directorios..."
mkdir -p data
echo "✅ Directorio data/ creado/verificado"

# 3. Restaurar DB si está vacía o falta
echo ""
echo "💾 Verificando base de datos..."

# Buscar el backup más reciente
latest_backup=""
if [ -d "emergency_backups" ]; then
    latest_backup=$(ls -t emergency_backups/*.db 2>/dev/null | head -1 || echo "")
fi

# Si no hay DB o está vacía, intentar restaurar
if [ ! -f "data/users.db" ] || [ ! -s "data/users.db" ]; then
    echo "🚨 Base de datos falta o está vacía"

    if [ ! -z "$latest_backup" ]; then
        echo "🔄 Restaurando desde backup más reciente: $latest_backup"
        cp "$latest_backup" "data/users.db"
        echo "✅ Base de datos restaurada"
    else
        echo "⚠️ No hay backups disponibles, creando DB nueva"
        touch "data/users.db"
    fi
fi

# 4. Verificar y arreglar permisos
echo ""
echo "🔐 Arreglando permisos..."
chmod 755 . 2>/dev/null || true
chmod 755 data/ 2>/dev/null || true
chmod 644 data/*.db 2>/dev/null || true
chmod 644 *.db 2>/dev/null || true
echo "✅ Permisos arreglados"

# 5. Instalar dependencias si faltan
echo ""
echo "📦 Verificando dependencias..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "🔄 Instalando dependencias..."
    npm install --production
    echo "✅ Dependencias instaladas"
else
    echo "✅ Dependencias OK"
fi

# 6. Verificar .env
echo ""
echo "🔧 Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "⚠️ Archivo .env falta - creando uno básico"
    cat > .env << 'EOF'
# Configuración básica para producción
PORT=3001
NODE_ENV=production
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
SESSION_SECRET=tu_session_secret_super_seguro_aqui

# Google OAuth (configura estos valores)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://tu-dominio.com/auth/google/callback
FRONTEND_URL=https://tu-dominio.com

# OpenAI (si usas asistente)
OPENAI_API_KEY=your_openai_key_here
EOF
    echo "⚠️ IMPORTANTE: Configura .env con tus valores reales"
else
    echo "✅ .env existe"
fi

# 7. Verificar server.js
echo ""
echo "📋 Verificando archivos principales..."
if [ ! -f "server.js" ]; then
    echo "❌ CRÍTICO: server.js falta"
    exit 1
else
    echo "✅ server.js OK"
fi

# 8. Matar procesos viejos y reiniciar
echo ""
echo "🔄 Reiniciando aplicación..."

# Matar procesos viejos de Node
pkill -f "node.*server.js" 2>/dev/null || echo "No hay procesos previos"
sleep 2

# Iniciar la aplicación
echo "🚀 Iniciando aplicación..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop smartchatix 2>/dev/null || true
    pm2 delete smartchatix 2>/dev/null || true
    pm2 start server.js --name smartchatix
    echo "✅ Aplicación iniciada con PM2"
else
    nohup node server.js > app.log 2>&1 &
    echo "✅ Aplicación iniciada en background"
    echo "📋 Logs disponibles en: app.log"
fi

# 9. Verificación final
echo ""
echo "🔍 Verificación final..."
sleep 3

if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Aplicación ejecutándose"
else
    echo "❌ Aplicación no está ejecutándose"
fi

echo ""
echo "🎉 REPARACIÓN COMPLETADA"
echo "=================================================="
echo ""
echo "📋 VERIFICACIONES RECOMENDADAS:"
echo "1. Visita tu sitio web y verifica que carga"
echo "2. Intenta crear una tarea para verificar la DB"
echo "3. Revisa los logs si hay errores: tail -f app.log"
echo ""
echo "🚨 Si aún tienes problemas:"
echo "1. Ejecuta: tail -f app.log"
echo "2. Busca errores específicos"
echo "3. Verifica la configuración en .env"
echo ""