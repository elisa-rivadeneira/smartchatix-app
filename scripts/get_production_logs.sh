#!/bin/bash

# 🔍 OBTENER LOGS DE PRODUCCIÓN Y ERRORES

echo "🔍 OBTENIENDO LOGS DE PRODUCCIÓN"
echo "=================================================="

# 1. Ver logs recientes de npm (pueden tener pistas)
echo "📋 NPM logs recientes:"
if [ -f "/root/.npm/_logs/2026-01-25T20_15_16_927Z-debug-0.log" ]; then
    echo "🔍 Últimos errores de NPM:"
    tail -20 /root/.npm/_logs/2026-01-25T20_15_16_927Z-debug-0.log
else
    echo "⚠️ No hay logs recientes de NPM"
fi

echo ""
echo "=================================================="

# 2. Ir al directorio de la app
cd /app || { echo "❌ No se puede acceder a /app"; exit 1; }

# 3. Verificar procesos actuales
echo "🔄 Procesos Node actuales:"
ps aux | grep node | grep -v grep || echo "❌ No hay procesos Node ejecutándose"

echo ""

# 4. Matar procesos existentes y iniciar con logs
echo "🚀 Iniciando servidor con logs detallados..."
pkill -f "node.*server.js" 2>/dev/null || echo "No hay procesos previos"
sleep 2

# 5. Iniciar con logs completos
echo "📊 Iniciando node server.js con logs..."
echo "⚠️ IMPORTANTE: Después de esto, ve a tu sitio web e intenta crear una tarea"
echo "⚠️ Los errores aparecerán aquí abajo:"
echo "=================================================="

# Iniciar con logs visibles
exec node server.js 2>&1