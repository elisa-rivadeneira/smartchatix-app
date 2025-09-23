# 🤖 Asistente Personal Diario

Sistema de asistente personal que saluda automáticamente cada día a las 6:00 AM y mantiene memoria persistente del usuario, proyectos y contexto conversacional.

## ✨ Características Principales

### 🌅 Saludo Matutino Automático
- Se activa automáticamente a las 6:00 AM cada día
- Saludo personalizado basado en el contexto del usuario
- Incluye estadísticas de progreso y rachas
- Muestra proyectos activos y prioridades

### 🧠 Memoria Persistente
- **Perfil de usuario**: Nombre, preferencias, objetivos, motivaciones
- **Proyectos**: Seguimiento de proyectos activos con estado y progreso
- **Prioridades**: Lista de prioridades actuales
- **Contexto conversacional**: Temas recientes, tareas pendientes
- **Estadísticas**: Rachas diarias, días totales activos

### 📊 Gestión de Contexto
- Análisis automático de mensajes para extraer contexto
- Actualización dinámica de temas y acciones
- Seguimiento de logros y progreso
- Log de conversaciones diarias que se reinicia automáticamente

## 🚀 Uso

### Ejecutar el Asistente
```bash
node src/app.js
```

### Probar Saludo Matutino
```bash
node src/app.js --test-greeting
```

### Ver Ayuda
```bash
node src/app.js --help
```

## 📁 Estructura del Sistema

```
src/
├── app.js              # Aplicación principal
├── assistantManager.js # Gestor principal del asistente
├── dailyScheduler.js   # Programador de tareas diarias
└── userMemory.js       # Sistema de memoria persistente

Archivos generados:
├── user_memory.json    # Memoria persistente del usuario
└── chat_log.json       # Log de conversaciones del día
```

## 🔧 Componentes

### 1. UserMemory (`userMemory.js`)
Maneja la persistencia de datos del usuario:
- Información personal y preferencias
- Proyectos y su estado
- Prioridades y objetivos
- Estadísticas y métricas de uso
- Contexto conversacional

### 2. DailyScheduler (`dailyScheduler.js`)
Gestiona la programación automática:
- Saludo matutino a las 6:00 AM
- Reinicio del log diario
- Generación de saludos personalizados
- Cálculo de rachas y estadísticas

### 3. AssistantManager (`assistantManager.js`)
Coordina todas las funcionalidades:
- Procesamiento de mensajes
- Análisis de contexto
- Gestión de proyectos y prioridades
- Generación de resúmenes diarios

### 4. DailyAssistantApp (`app.js`)
Aplicación principal que:
- Inicializa el sistema
- Proporciona interfaz CLI
- Mantiene el proceso activo
- Maneja shutdown graceful

## 📈 Funcionalidades de Seguimiento

### Estadísticas Diarias
- **Racha**: Días consecutivos de actividad
- **Total de días**: Días totales usando el asistente
- **Proyectos activos**: Número de proyectos en curso
- **Mensajes intercambiados**: Conteo de conversación diaria

### Análisis de Contexto
El sistema analiza automáticamente los mensajes para detectar:
- Menciones de proyectos
- Objetivos y metas
- Tareas y acciones
- Logros completados

### Memoria Persistente
Los datos se guardan automáticamente en:
- `user_memory.json`: Información permanente del usuario
- `chat_log.json`: Conversaciones del día actual (se reinicia a las 6 AM)

## 🎯 Casos de Uso

1. **Seguimiento de Proyectos**: Mantiene registro de proyectos activos y su progreso
2. **Gestión de Prioridades**: Recordatorios de tareas importantes
3. **Motivación Diaria**: Saludo personalizado con estadísticas de progreso
4. **Continuidad Conversacional**: Mantiene contexto entre sesiones
5. **Análisis de Productividad**: Estadísticas de uso y logros

## 🔄 Flujo Diario

1. **6:00 AM**: Saludo automático personalizado
2. **Durante el día**: Procesamiento de mensajes y actualización de contexto
3. **Fin del día**: Generación de resumen diario
4. **6:00 AM siguiente**: Reinicio del log y nuevo saludo

## ⚙️ Configuración

El sistema crea automáticamente:
- Memoria de usuario con valores por defecto
- Archivos de configuración necesarios
- Logs de conversación
- Estructura de datos persistente

La zona horaria por defecto es `America/Mexico_City` pero se puede modificar en el perfil de usuario.

## 🛡️ Características de Robustez

- Manejo de errores en carga/guardado de archivos
- Recuperación automática con valores por defecto
- Shutdown graceful con SIGINT/SIGTERM
- Logs de errores para debugging
- Validación de datos de entrada

Este sistema proporciona un asistente personal completo que mantiene continuidad y contexto a través del tiempo, ofreciendo una experiencia personalizada y motivadora cada día.