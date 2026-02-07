#!/bin/bash

# 🔧 ARREGLAR ESQUEMA DE BASE DE DATOS (versión bash)

echo "🔧 ARREGLANDO ESQUEMA DE BASE DE DATOS"
echo "=================================================="

DB_PATH="/app/data/users.db"

# Verificar que la DB existe
if [ ! -f "$DB_PATH" ]; then
    echo "❌ CRÍTICO: Base de datos no encontrada en: $DB_PATH"
    exit 1
fi

echo "✅ Base de datos encontrada: $DB_PATH"

# Crear backup
timestamp=$(date +%Y-%m-%d_%H-%M-%S)
backup_path="/app/data/users_schema_fix_${timestamp}.db"

cp "$DB_PATH" "$backup_path"
echo "💾 Backup creado: $backup_path"

# Agregar columnas faltantes
echo ""
echo "🔧 Agregando columnas faltantes..."

# Función para agregar columna si no existe
add_column_if_missing() {
    table=$1
    column=$2
    type=${3:-"INTEGER DEFAULT 0"}

    # Verificar si la tabla existe
    table_exists=$(sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null)

    if [ -z "$table_exists" ]; then
        echo "⚠️ Tabla $table no existe, saltando..."
        return
    fi

    # Verificar si la columna ya existe
    column_exists=$(sqlite3 "$DB_PATH" "PRAGMA table_info($table);" | grep -c "^[0-9]*|$column|")

    if [ "$column_exists" -gt 0 ]; then
        echo "✅ Tabla $table ya tiene columna '$column'"
    else
        # Agregar la columna
        sqlite3 "$DB_PATH" "ALTER TABLE $table ADD COLUMN $column $type;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Columna '$column' agregada a tabla $table"
        else
            echo "❌ Error agregando columna $column a $table"
        fi
    fi
}

# Agregar columnas necesarias
add_column_if_missing "daily_tasks" "archived"
add_column_if_missing "project_tasks" "archived"

echo ""
echo "📊 Verificando esquema final..."

# Verificar esquemas finales
for table in "daily_tasks" "project_tasks"; do
    table_exists=$(sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null)

    if [ -z "$table_exists" ]; then
        echo "⚠️ Tabla $table: no existe"
    else
        column_exists=$(sqlite3 "$DB_PATH" "PRAGMA table_info($table);" | grep -c "^[0-9]*|archived|")
        if [ "$column_exists" -gt 0 ]; then
            echo "📋 Tabla $table: columna 'archived' ✅ PRESENTE"
        else
            echo "📋 Tabla $table: columna 'archived' ❌ FALTA"
        fi
    fi
done

echo ""
echo "🎉 ARREGLO DE ESQUEMA COMPLETADO"
echo "=================================================="
echo "📋 PRÓXIMOS PASOS:"
echo "1. Reinicia tu aplicación si es necesario"
echo "2. Prueba crear/eliminar/editar tareas"
echo "3. Los errores 500 deberían estar resueltos"