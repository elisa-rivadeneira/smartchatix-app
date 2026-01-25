#!/bin/bash

# 🔍 DIAGNÓSTICO DE PRODUCCIÓN
# Ejecuta esto en tu servidor de producción para encontrar el problema

echo "🔍 DIAGNÓSTICO DE SMARTCHATIX EN PRODUCCIÓN"
echo "=================================================="

# 1. Verificar ubicación actual
echo "📍 Ubicación actual:"
pwd
echo ""

# 2. Verificar base de datos
echo "💾 Estado de la base de datos:"
if [ -f "users.db" ]; then
    size=$(stat -c%s users.db 2>/dev/null || stat -f%z users.db 2>/dev/null || echo "0")
    echo "✅ users.db existe (${size} bytes)"
    if [ "$size" -eq 0 ]; then
        echo "❌ PROBLEMA: La base de datos está VACÍA"
    fi
else
    echo "❌ PROBLEMA: users.db NO EXISTE"
fi

if [ -f "data/users.db" ]; then
    size=$(stat -c%s data/users.db 2>/dev/null || stat -f%z data/users.db 2>/dev/null || echo "0")
    echo "✅ data/users.db existe (${size} bytes)"
    if [ "$size" -eq 0 ]; then
        echo "❌ PROBLEMA: La base de datos en data/ está VACÍA"
    fi
else
    echo "❌ PROBLEMA: data/users.db NO EXISTE"
fi

# 3. Verificar estructura de directorios
echo ""
echo "📁 Estructura de directorios:"
ls -la | head -15

# 4. Verificar archivos críticos
echo ""
echo "📋 Archivos críticos:"
for file in server.js package.json .env; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file FALTA"
    fi
done

# 5. Verificar node_modules
echo ""
echo "📦 Node modules:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules existe"
    echo "📊 Tamaño: $(du -sh node_modules 2>/dev/null | cut -f1 || echo 'unknown')"
else
    echo "❌ PROBLEMA: node_modules NO EXISTE - Ejecuta: npm install"
fi

# 6. Verificar variables de entorno
echo ""
echo "🔧 Variables de entorno:"
if [ -f ".env" ]; then
    echo "✅ .env existe"
    echo "📊 Líneas en .env: $(wc -l < .env)"
else
    echo "❌ PROBLEMA: .env NO EXISTE"
fi

# 7. Verificar procesos activos
echo ""
echo "🔄 Procesos de Node activos:"
ps aux | grep node | grep -v grep || echo "❌ No hay procesos de Node ejecutándose"

# 8. Verificar puerto 3001
echo ""
echo "🌐 Puerto 3001:"
if command -v netstat >/dev/null 2>&1; then
    netstat -tuln | grep :3001 || echo "❌ Puerto 3001 no está en uso"
elif command -v ss >/dev/null 2>&1; then
    ss -tuln | grep :3001 || echo "❌ Puerto 3001 no está en uso"
else
    echo "⚠️ No se puede verificar el puerto (netstat/ss no disponible)"
fi

# 9. Verificar logs recientes (si existen)
echo ""
echo "📜 Logs recientes:"
if [ -f "error.log" ]; then
    echo "🔍 Últimos errores:"
    tail -5 error.log
elif [ -f "nohup.out" ]; then
    echo "🔍 Últimos logs de nohup:"
    tail -5 nohup.out
else
    echo "⚠️ No se encontraron archivos de log"
fi

# 10. Verificar git status
echo ""
echo "📋 Estado de Git:"
git status --porcelain 2>/dev/null || echo "⚠️ No es un repositorio git o hay problemas"

echo ""
echo "🎯 DIAGNÓSTICO COMPLETADO"
echo "=================================================="
echo ""
echo "💡 ACCIONES SUGERIDAS:"
echo "1. Si users.db falta o está vacía: Necesitas restaurar desde backup"
echo "2. Si node_modules falta: Ejecuta 'npm install'"
echo "3. Si .env falta: Copia la configuración necesaria"
echo "4. Si hay errores de permisos: Ejecuta 'chmod 644 *.db' y 'chmod 755 .'"
echo ""