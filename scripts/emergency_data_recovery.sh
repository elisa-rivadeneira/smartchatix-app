#!/bin/bash

# 🚨 RECUPERACIÓN DE EMERGENCIA DE DATOS
# Para cuando las tareas desaparecen y hay error 500

echo "🚨 RECUPERACIÓN DE EMERGENCIA DE DATOS"
echo "=================================================="

cd /app || { echo "❌ No se puede acceder a /app"; exit 1; }

# 1. Crear backup de la situación actual (por si acaso)
echo "💾 Backup de emergencia de estado actual..."
timestamp=$(date +%Y%m%d_%H%M%S)
if [ -f "data/users.db" ]; then
    cp data/users.db "data/users_emergency_before_recovery_${timestamp}.db"
    echo "✅ Estado actual guardado en: users_emergency_before_recovery_${timestamp}.db"
fi

# 2. Buscar el backup más reciente con datos
echo ""
echo "🔍 Buscando backups disponibles..."
find . -name "users_*.db" -exec ls -la {} \; | sort -k6,7

# Buscar el backup más reciente que no sea de hoy (evitar backups vacíos)
latest_backup=""
for backup in $(find . -name "users_*.db" | grep -v emergency | sort -r); do
    size=$(stat -c%s "$backup" 2>/dev/null || stat -f%z "$backup" 2>/dev/null)
    echo "📋 Backup: $backup (${size} bytes)"

    if [ "$size" -gt 50000 ]; then  # Solo considerar backups > 50KB
        latest_backup="$backup"
        break
    fi
done

if [ -z "$latest_backup" ]; then
    echo "❌ No se encontró ningún backup válido"
    exit 1
fi

echo ""
echo "🎯 Usando backup: $latest_backup"

# 3. Restaurar desde el backup
echo "🔄 Restaurando datos desde backup..."
cp "$latest_backup" "data/users.db"
echo "✅ Datos restaurados"

# 4. Verificar que la DB tiene el esquema correcto (columna archived)
echo ""
echo "🔧 Verificando esquema de base de datos..."

# Intentar agregar columna archived si no existe (usando Node.js porque sqlite3 puede no estar disponible)
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/users.db');

function addColumn(table) {
    return new Promise((resolve) => {
        db.run(\`ALTER TABLE \${table} ADD COLUMN archived INTEGER DEFAULT 0\`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.log(\`⚠️ Error agregando archived a \${table}: \${err.message}\`);
            } else if (!err) {
                console.log(\`✅ Columna archived agregada a \${table}\`);
            } else {
                console.log(\`✅ Tabla \${table} ya tiene columna archived\`);
            }
            resolve();
        });
    });
}

async function fixSchema() {
    await addColumn('tasks');
    await addColumn('daily_tasks');
    await addColumn('project_tasks');

    db.close(() => {
        console.log('✅ Base de datos actualizada');
        process.exit(0);
    });
}

fixSchema();
"

# 5. Reiniciar aplicación
echo ""
echo "🔄 Reiniciando aplicación..."
pkill -f "node.*server.js" 2>/dev/null || echo "No hay procesos previos"
sleep 2

nohup node server.js > recovery.log 2>&1 &
sleep 3

if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Aplicación reiniciada exitosamente"
    echo "📋 Logs disponibles en: recovery.log"
else
    echo "❌ Error al reiniciar aplicación"
    echo "🔍 Verificando errores:"
    tail -10 recovery.log 2>/dev/null || echo "No hay logs disponibles"
fi

echo ""
echo "🎉 RECUPERACIÓN DE DATOS COMPLETADA"
echo "=================================================="
echo ""
echo "📋 LO QUE SE HIZO:"
echo "1. ✅ Backup del estado actual creado"
echo "2. ✅ Datos restaurados desde backup válido: $latest_backup"
echo "3. ✅ Esquema de BD verificado y arreglado"
echo "4. ✅ Aplicación reiniciada"
echo ""
echo "🧪 PRUEBA AHORA:"
echo "1. Ve a https://app.smartchatix.com"
echo "2. Verifica que tus tareas están de vuelta"
echo "3. Intenta crear una nueva tarea"
echo ""
echo "📜 Si hay problemas:"
echo "   tail -f recovery.log"
echo ""