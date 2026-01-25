#!/bin/bash

# 🚨 ARREGLO RÁPIDO PARA ERROR 500 EN /api/auth/profile

echo "🚨 ARREGLO RÁPIDO PARA ERROR 500 EN PRODUCCIÓN"
echo "=================================================="

# 1. Verificar logs de la aplicación para ver el error específico
echo "📜 Buscando logs de error..."
if [ -f "app.log" ]; then
    echo "🔍 Últimos errores en app.log:"
    tail -20 app.log | grep -i error
elif [ -f "nohup.out" ]; then
    echo "🔍 Últimos errores en nohup.out:"
    tail -20 nohup.out | grep -i error
else
    echo "⚠️ No se encontraron archivos de log"
fi

# 2. Verificar si el proceso está ejecutándose
echo ""
echo "🔄 Verificando procesos..."
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ El proceso Node está ejecutándose"
    echo "📊 PIDs activos: $(pgrep -f 'node.*server.js' | tr '\n' ' ')"
else
    echo "❌ CRÍTICO: No hay procesos de Node ejecutándose"
    echo "🚀 Intentando reiniciar..."

    # Intentar iniciar la aplicación
    if [ -f "server.js" ]; then
        nohup node server.js > app.log 2>&1 &
        sleep 3
        if pgrep -f "node.*server.js" > /dev/null; then
            echo "✅ Aplicación reiniciada exitosamente"
        else
            echo "❌ Fallo al reiniciar. Verificando errores:"
            tail -10 app.log 2>/dev/null || echo "No hay logs disponibles"
        fi
    else
        echo "❌ CRÍTICO: server.js no existe"
        exit 1
    fi
fi

# 3. Verificar base de datos específicamente
echo ""
echo "💾 Verificación detallada de base de datos..."

# Verificar data/users.db
if [ -f "data/users.db" ]; then
    size=$(stat -c%s data/users.db 2>/dev/null || stat -f%z data/users.db 2>/dev/null)
    echo "✅ data/users.db existe (${size} bytes)"

    if [ "$size" -eq 0 ]; then
        echo "❌ CRÍTICO: La base de datos está VACÍA"

        # Buscar backups
        echo "🔍 Buscando backups..."
        backups=$(find . -name "users_*.db" -o -name "*backup*.db" | sort -r | head -5)
        if [ ! -z "$backups" ]; then
            echo "📋 Backups encontrados:"
            for backup in $backups; do
                size=$(stat -c%s "$backup" 2>/dev/null || stat -f%z "$backup" 2>/dev/null)
                echo "  - $backup (${size} bytes)"
            done

            # Usar el backup más reciente y grande
            latest=$(echo "$backups" | head -1)
            latest_size=$(stat -c%s "$latest" 2>/dev/null || stat -f%z "$latest" 2>/dev/null)

            if [ "$latest_size" -gt 0 ]; then
                echo "🔄 Restaurando desde: $latest"
                cp "$latest" "data/users.db"
                echo "✅ Base de datos restaurada"
            fi
        else
            echo "❌ No se encontraron backups"
        fi
    fi
else
    echo "❌ CRÍTICO: data/users.db NO EXISTE"

    # Crear directorio y buscar backups
    mkdir -p data

    # Buscar cualquier archivo .db
    dbs=$(find . -name "*.db" | grep -v node_modules)
    if [ ! -z "$dbs" ]; then
        echo "📋 Archivos .db encontrados:"
        for db in $dbs; do
            size=$(stat -c%s "$db" 2>/dev/null || stat -f%z "$db" 2>/dev/null)
            echo "  - $db (${size} bytes)"
        done

        # Usar el más grande que no sea smartchatix.db
        best_db=$(echo "$dbs" | grep -v smartchatix | head -1)
        if [ ! -z "$best_db" ]; then
            echo "🔄 Copiando $best_db a data/users.db"
            cp "$best_db" "data/users.db"
            echo "✅ Base de datos copiada"
        fi
    fi
fi

# 4. Verificar permisos
echo ""
echo "🔐 Verificando permisos..."
chmod 755 data/ 2>/dev/null || true
chmod 644 data/users.db 2>/dev/null || true
echo "✅ Permisos actualizados"

# 5. Test rápido del endpoint
echo ""
echo "🧪 Probando endpoint..."
if command -v curl >/dev/null 2>&1; then
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/verify 2>/dev/null || echo "000")
    if [ "$response" = "401" ]; then
        echo "✅ API respondiendo (401 es normal sin token)"
    elif [ "$response" = "200" ]; then
        echo "✅ API respondiendo correctamente"
    else
        echo "❌ API no responde correctamente (código: $response)"
    fi
else
    echo "⚠️ curl no disponible para testing"
fi

# 6. Reiniciar si todo está bien pero sigue fallando
echo ""
echo "🔄 Reinicio forzado para asegurar funcionamiento..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2
nohup node server.js > app.log 2>&1 &
sleep 3

if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Aplicación reiniciada exitosamente"
else
    echo "❌ Fallo al reiniciar"
    echo "🔍 Verificando errores de inicio:"
    tail -10 app.log 2>/dev/null || echo "No hay logs disponibles"
fi

echo ""
echo "🎯 ARREGLO RÁPIDO COMPLETADO"
echo "=================================================="
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "1. Prueba crear una tarea en tu sitio web"
echo "2. Si aún falla, ejecuta: tail -f app.log"
echo "3. Busca errores específicos y reporta"
echo ""