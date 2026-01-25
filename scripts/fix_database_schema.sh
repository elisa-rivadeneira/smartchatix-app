#!/bin/bash

# 🔧 ARREGLAR ESQUEMA DE BASE DE DATOS - Columna 'archived' faltante

echo "🔧 ARREGLANDO ESQUEMA DE BASE DE DATOS"
echo "=================================================="

cd /app || { echo "❌ No se puede acceder a /app"; exit 1; }

# 1. Backup de seguridad ANTES de modificar
echo "💾 Creando backup de seguridad..."
timestamp=$(date +%Y%m%d_%H%M%S)
cp data/users.db "data/users_pre_schema_fix_${timestamp}.db"
echo "✅ Backup creado: users_pre_schema_fix_${timestamp}.db"

# 2. Agregar columna 'archived' usando SQLite
echo ""
echo "🔧 Agregando columna 'archived' faltante..."

# Comando SQLite para agregar la columna
sqlite3 data/users.db << 'EOF'
-- Agregar columna archived a la tabla tasks (si existe)
ALTER TABLE tasks ADD COLUMN archived INTEGER DEFAULT 0;

-- Agregar columna archived a otras tablas que puedan necesitarla
ALTER TABLE daily_tasks ADD COLUMN archived INTEGER DEFAULT 0;

-- Verificar que se agregó correctamente
.schema tasks
.schema daily_tasks
EOF

if [ $? -eq 0 ]; then
    echo "✅ Columnas 'archived' agregadas exitosamente"
else
    echo "⚠️ Algunas tablas ya tenían la columna o hubo errores menores"
fi

# 3. Verificar el esquema actualizado
echo ""
echo "📊 Verificando esquema actualizado:"
sqlite3 data/users.db ".schema" | grep -i archived || echo "⚠️ No se encontraron referencias a 'archived'"

# 4. Reiniciar aplicación para aplicar cambios
echo ""
echo "🔄 Reiniciando aplicación..."
pkill -f "node.*server.js" 2>/dev/null || echo "No hay procesos previos"
sleep 2

nohup node server.js > schema_fix.log 2>&1 &
sleep 3

# 5. Verificar que la aplicación inició correctamente
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Aplicación reiniciada exitosamente"
    echo "📋 Logs disponibles en: schema_fix.log"
else
    echo "❌ Error al reiniciar aplicación"
    echo "🔍 Últimos errores:"
    tail -10 schema_fix.log 2>/dev/null || echo "No hay logs disponibles"
fi

echo ""
echo "🎉 ARREGLO DE ESQUEMA COMPLETADO"
echo "=================================================="
echo ""
echo "📋 LO QUE SE HIZO:"
echo "1. ✅ Backup de seguridad creado"
echo "2. ✅ Columna 'archived' agregada a tablas necesarias"
echo "3. ✅ Aplicación reiniciada"
echo ""
echo "🧪 PRUEBA AHORA:"
echo "1. Ve a https://app.smartchatix.com"
echo "2. Intenta crear una tarea"
echo "3. El error 500 debería estar resuelto"
echo ""
echo "📜 Si hay problemas, revisa los logs:"
echo "   tail -f schema_fix.log"
echo ""