# 🛡️ Sistema de Backup Automático de Base de Datos

## 📋 ¿Qué es?

Este sistema protege automáticamente los datos de usuarios creando copias de seguridad de la base de datos sin incluirlas en git. ¡Nunca más perderas datos de usuarios por commits accidentales!

## 🔄 ¿Cómo funciona?

### **Automático:**
- ✅ **Backup al iniciar servidor** - Crea backup inmediatamente cuando arranca
- ⏰ **Backup cada 4 horas** - Mientras el servidor esté corriendo
- 🧹 **Limpieza automática** - Mantiene solo los últimos 30 backups
- 🛡️ **Protección git** - Los backups NUNCA se suben al repositorio

### **Manual:**
```bash
# Crear backup inmediato
node backup_system.js backup

# Ver todos los backups disponibles
node backup_system.js list

# Restaurar un backup específico
node backup_system.js restore users_2026-01-14T11-57-21-866Z.db
```

## 📂 Estructura de Archivos

```
project_manager/
├── backups/                    # ← Carpeta de backups (NO en git)
│   ├── users_2026-01-14T11-57-21-866Z.db
│   ├── users_2026-01-14T15-30-45-123Z.db
│   └── ... (hasta 30 backups)
├── data/
│   └── users.db               # ← BD principal (NO en git)
├── backup_system.js           # ← Sistema de backup
├── recover_database.js        # ← Script de recuperación de emergencia
└── .gitignore                 # ← Actualizado automáticamente
```

## 🚨 Emergencias

### **Si perdiste datos:**
1. **Ve qué backups tienes:**
   ```bash
   node backup_system.js list
   ```

2. **Restaura el backup más reciente:**
   ```bash
   node backup_system.js restore [nombre-del-backup]
   ```

3. **Reinicia el servidor**

### **Si git se vuelve loco:**
1. **Usa el script de recuperación:**
   ```bash
   node recover_database.js
   ```

2. **Recuperación automática desde git:**
   ```bash
   node recover_database.js auto
   ```

## ✅ Protección git

El sistema automáticamente actualiza `.gitignore` para proteger:
- `backups/` - Todos los backups
- `data/users.db` - Base de datos principal
- `uploads/` - Archivos de usuarios
- `auth_logs.json` - Logs de autenticación
- `user_memory.json` - Memoria del asistente

## 📊 Ventajas

1. **🔄 Automático** - No tienes que recordar hacer backups
2. **🛡️ Seguro** - Los datos de usuarios nunca van a git
3. **⚡ Rápido** - Backups en segundos
4. **🧹 Limpio** - Auto-limpieza de backups antiguos
5. **🚨 Recuperable** - Múltiples opciones de recuperación
6. **📱 Escalable** - Listo para cuando tengas muchos usuarios

## 🔧 Configuración

El sistema está pre-configurado con valores óptimos:
- **Intervalo:** 4 horas
- **Máximo backups:** 30 (aprox. 5 días)
- **Ubicación:** `./backups/`

Para cambiar la configuración, edita `backup_system.js`:
```javascript
this.maxBackups = 50; // Más backups
// Backup cada 2 horas: 2 * 60 * 60 * 1000
```

## 🎯 Estados del Sistema

Cuando inicies el servidor, verás:
```
💾 Inicializando sistema de backup...
✅ .gitignore actualizado para proteger datos de usuarios
✅ Backup creado: users_2026-01-14T11-57-21-866Z.db
⏰ Sistema de backup automático iniciado (cada 4 horas)
🚀 Servidor ejecutándose...
💾 Sistema de backup automático: ✅ ACTIVO
```

## ❓ Preguntas Frecuentes

**¿Los backups ocupan mucho espacio?**
No, cada backup ocupa ~144KB. 30 backups = ~4.3MB total.

**¿Qué pasa si el servidor se reinicia?**
Se crea un nuevo backup automáticamente al iniciar.

**¿Puedo hacer backups manuales?**
Sí, usa `node backup_system.js backup` cuando quieras.

**¿Los backups van a git?**
¡NUNCA! El sistema protege automáticamente el `.gitignore`.

**¿Funciona en producción?**
Sí, diseñado especialmente para producción segura.

---

¡Tu base de datos está protegida! 🛡️✨