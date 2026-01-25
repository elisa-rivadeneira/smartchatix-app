#!/bin/bash

# 🐛 DIAGNÓSTICO ESPECÍFICO PARA ERROR 500 EN /api/auth/profile
# Este script captura los errores exactos del endpoint

echo "🐛 DIAGNÓSTICO ESPECÍFICO PARA ERROR 500 EN /api/auth/profile"
echo "=============================================================="

cd /app || { echo "❌ No se puede acceder a /app"; exit 1; }

echo "🔍 Paso 1: Verificar estado actual..."

# 1. Verificar que el servidor esté ejecutándose
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Servidor Node ejecutándose"
    echo "📊 PIDs: $(pgrep -f 'node.*server.js' | tr '\n' ' ')"
else
    echo "❌ PROBLEMA: Servidor Node NO ejecutándose"
    echo "🚀 Iniciando servidor..."
    nohup node server.js > debug_profile.log 2>&1 &
    sleep 3
fi

echo ""
echo "🔍 Paso 2: Verificar estructura de base de datos..."

# 2. Verificar que la base de datos exista y no esté corrupta
if [ -f "data/users.db" ]; then
    size=$(stat -c%s data/users.db 2>/dev/null || stat -f%z data/users.db 2>/dev/null)
    echo "✅ Base de datos existe (${size} bytes)"

    if [ "$size" -lt 1000 ]; then
        echo "⚠️ ADVERTENCIA: Base de datos muy pequeña, posible corrupción"
    fi
else
    echo "❌ CRÍTICO: Base de datos data/users.db NO EXISTE"
    exit 1
fi

echo ""
echo "🔍 Paso 3: Verificar esquema de tablas..."

# 3. Verificar esquemas de tablas usando Node.js
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/users.db');

console.log('📋 Verificando tablas...');

const tables = ['users', 'projects', 'tasks', 'daily_tasks', 'project_tasks'];

function checkTable(tableName) {
    return new Promise((resolve) => {
        db.get(\"SELECT name FROM sqlite_master WHERE type='table' AND name=?\", [tableName], (err, row) => {
            if (err || !row) {
                console.log(\`❌ Tabla \${tableName}: NO EXISTE\`);
                resolve(false);
                return;
            }

            db.all(\`PRAGMA table_info(\${tableName})\`, (err, columns) => {
                if (err) {
                    console.log(\`❌ Tabla \${tableName}: ERROR al leer esquema\`);
                    resolve(false);
                } else {
                    console.log(\`✅ Tabla \${tableName}: ${columns.length} columnas\`);
                    // Verificar columnas críticas
                    const cols = columns.map(c => c.name);
                    if (tableName === 'users' && !cols.includes('id')) {
                        console.log(\`⚠️ Tabla \${tableName}: falta columna 'id'\`);
                    }
                    if ((tableName === 'tasks' || tableName === 'daily_tasks' || tableName === 'project_tasks') && !cols.includes('archived')) {
                        console.log(\`⚠️ Tabla \${tableName}: falta columna 'archived'\`);
                    }
                    resolve(true);
                }
            });
        });
    });
}

async function checkAll() {
    for (const table of tables) {
        await checkTable(table);
    }

    db.close(() => {
        console.log('📊 Verificación de esquemas completada');
    });
}

checkAll();
" 2>/dev/null

echo ""
echo "🔍 Paso 4: Probar endpoint con logs en tiempo real..."

echo "🔥 MATANDO SERVIDOR PARA REINICAR CON LOGS VERBOSOS..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

echo "🚀 INICIANDO SERVIDOR CON LOGS DETALLADOS..."
echo "📋 Los logs se guardarán en: debug_profile.log"
echo ""

# 4. Iniciar con logs detallados y probar endpoint inmediatamente
nohup node server.js > debug_profile.log 2>&1 &
sleep 3

if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Servidor iniciado con logs detallados"

    # 5. Probar endpoint directamente
    echo ""
    echo "🧪 Probando endpoint /api/auth/profile..."

    # Test sin token (debería dar 401)
    echo "📍 Test 1: Sin token (esperando 401)..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/profile 2>/dev/null || echo "000")
    if [ "$response" = "401" ]; then
        echo "✅ Respuesta correcta sin token: 401"
    else
        echo "❌ Respuesta inesperada sin token: $response"
    fi

    # Test con token inválido (debería dar 401 o 403)
    echo "📍 Test 2: Con token inválido (esperando 401/403)..."
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer token_falso" http://localhost:3001/api/auth/profile 2>/dev/null || echo "000")
    if [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo "✅ Respuesta correcta con token inválido: $response"
    else
        echo "❌ Respuesta inesperada con token inválido: $response"
        echo "🚨 ESTO PODRÍA INDICAR EL PROBLEMA"
    fi

    sleep 2

    echo ""
    echo "📜 Últimos logs del servidor:"
    tail -20 debug_profile.log | grep -E "(error|Error|ERROR)" || echo "No hay errores visibles en logs recientes"

else
    echo "❌ ERROR: Servidor no pudo iniciar"
    echo "🔍 Logs de error:"
    cat debug_profile.log 2>/dev/null || echo "No hay logs disponibles"
fi

echo ""
echo "🎯 DIAGNÓSTICO COMPLETADO"
echo "=============================================================="
echo ""
echo "📋 INSTRUCCIONES PARA CONTINUAR:"
echo "1. Los logs detallados están en: debug_profile.log"
echo "2. Ahora ve a tu sitio web e intenta crear una tarea"
echo "3. Inmediatamente después, ejecuta:"
echo "   tail -f debug_profile.log"
echo "4. Busca el error exacto que aparece cuando haces la acción"
echo ""
echo "🚨 BUSCA ESTOS PATRONES DE ERROR:"
echo "   - 'SQLITE_ERROR'"
echo "   - 'no such table'"
echo "   - 'no such column'"
echo "   - 'cannot read property'"
echo "   - 'undefined is not a function'"
echo ""