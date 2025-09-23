const AssistantManager = require('./assistantManager');

class DailyAssistantApp {
  constructor() {
    this.assistant = new AssistantManager();
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 Iniciando Asistente Personal Diario...\n');

    try {
      // Initialize assistant
      const context = this.assistant.initialize();
      this.isRunning = true;

      // Show welcome message with current context
      this.showWelcomeMessage(context);

      // Set up graceful shutdown
      this.setupShutdownHandlers();

      console.log('\n✅ Asistente listo. El saludo matutino se activará automáticamente a las 6:00 AM cada día.');
      console.log('💡 Usa Ctrl+C para detener el asistente.\n');

      // Keep the application running
      this.keepAlive();

    } catch (error) {
      console.error('❌ Error al inicializar el asistente:', error);
      process.exit(1);
    }
  }

  showWelcomeMessage(context) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES');

    console.log('┌' + '─'.repeat(58) + '┐');
    console.log('│' + ' '.repeat(58) + '│');
    console.log('│' + ' '.repeat(10) + '🤖 ASISTENTE PERSONAL ACTIVO' + ' '.repeat(17) + '│');
    console.log('│' + ' '.repeat(58) + '│');
    console.log('├' + '─'.repeat(58) + '┤');
    console.log(`│ ⏰ Hora actual: ${timeString}` + ' '.repeat(58 - 17 - timeString.length) + '│');
    console.log(`│ 📊 Días activos: ${context.stats.totalDays} | Racha: ${context.stats.streak}` + ' '.repeat(58 - 15 - context.stats.totalDays.toString().length - context.stats.streak.toString().length - 9) + '│');
    console.log(`│ 📋 Proyectos activos: ${context.projects.length}` + ' '.repeat(58 - 21 - context.projects.length.toString().length) + '│');
    console.log(`│ ⭐ Prioridades: ${context.priorities.length}` + ' '.repeat(58 - 16 - context.priorities.length.toString().length) + '│');
    console.log('│' + ' '.repeat(58) + '│');
    console.log('└' + '─'.repeat(58) + '┘');

    if (context.projects.length > 0) {
      console.log('\n📋 Proyectos actuales:');
      context.projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (${project.status})`);
      });
    }

    if (context.priorities.length > 0) {
      console.log('\n⭐ Prioridades:');
      context.priorities.forEach((priority, index) => {
        console.log(`   ${index + 1}. ${priority.title}`);
      });
    }
  }

  setupShutdownHandlers() {
    const shutdown = () => {
      console.log('\n\n🔄 Cerrando asistente...');
      this.assistant.shutdown();
      this.isRunning = false;
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no controlado:', error);
      shutdown();
    });
  }

  keepAlive() {
    // Keep the process alive
    setInterval(() => {
      if (!this.isRunning) {
        process.exit(0);
      }
    }, 1000);
  }

  // API methods for external integration
  processMessage(message) {
    return this.assistant.processUserMessage(message);
  }

  sendResponse(message) {
    return this.assistant.sendAssistantMessage(message);
  }

  addProject(projectData) {
    return this.assistant.addProject(projectData);
  }

  getDailyContext() {
    return this.assistant.getDailyContext();
  }

  triggerMorningGreeting() {
    console.log('\n🧪 Activando saludo matutino manualmente...\n');
    this.assistant.triggerMorningGreeting();
  }
}

// CLI functionality
if (require.main === module) {
  const app = new DailyAssistantApp();

  // Check for command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--test-greeting')) {
    console.log('🧪 Modo de prueba: Activando saludo matutino...\n');
    const assistant = new AssistantManager();
    assistant.initialize();
    assistant.triggerMorningGreeting();
    process.exit(0);
  } else if (args.includes('--help')) {
    console.log(`
🤖 Asistente Personal Diario

Uso:
  node app.js                 - Ejecutar el asistente
  node app.js --test-greeting - Probar el saludo matutino
  node app.js --help          - Mostrar esta ayuda

Características:
  • Saludo automático a las 6:00 AM cada día
  • Memoria persistente de usuario y proyectos
  • Seguimiento de progreso y rachas
  • Gestión de contexto conversacional
  • Log diario que se reinicia automáticamente
`);
    process.exit(0);
  } else {
    app.start();
  }
}

module.exports = DailyAssistantApp;