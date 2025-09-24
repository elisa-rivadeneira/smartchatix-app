const UserMemory = require('./userMemory');

class DailyScheduler {
  constructor() {
    this.userMemory = new UserMemory();
    this.greetingScheduled = false;
    this.currentInterval = null;
  }

  start() {
    this.scheduleNextGreeting();
    this.startDailyCheck();
  }

  scheduleNextGreeting() {
    const now = new Date();
    const target = new Date();
    target.setHours(6, 0, 0, 0);

    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }

    const timeUntilGreeting = target.getTime() - now.getTime();

    console.log(`Próximo saludo programado para: ${target.toLocaleString('es-ES')}`);

    // setTimeout(() => {
    //   this.sendMorningGreeting();
    //   this.scheduleNextGreeting();
    // }, timeUntilGreeting);
  }

  startDailyCheck() {
    this.currentInterval = setInterval(() => {
      this.checkDailyReset();
    }, 60000); // Check every minute
  }

  checkDailyReset() {
    const now = new Date();
    if (now.getHours() === 6 && now.getMinutes() === 0) {
      this.userMemory.clearDailyLog();
      // this.sendMorningGreeting();
    }
  }

  sendMorningGreeting() {
    const context = this.userMemory.getDailyContext();
    const greeting = this.generatePersonalizedGreeting(context);

    console.log('\n' + '='.repeat(60));
    console.log('🌅 SALUDO MATUTINO AUTOMÁTICO');
    console.log('='.repeat(60));
    console.log(greeting);
    console.log('='.repeat(60) + '\n');

    // Simulate sending greeting to chat interface
    this.logMessage('assistant', greeting);
  }

  generatePersonalizedGreeting(context) {
    const now = new Date();
    const userName = context.user.name || 'amigo';
    const dayName = now.toLocaleDateString('es-ES', { weekday: 'long' });
    const date = now.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let greeting = `¡Buenos días, ${userName}! 🌟\n\n`;
    greeting += `Hoy es ${dayName}, ${date}\n\n`;

    if (context.stats.streak > 1) {
      greeting += `🔥 ¡Llevas ${context.stats.streak} días consecutivos trabajando en tus objetivos!\n\n`;
    }

    if (context.projects.length > 0) {
      greeting += `📋 Tienes ${context.projects.length} proyecto(s) activo(s):\n`;
      context.projects.slice(0, 3).forEach(project => {
        greeting += `   • ${project.name} (${project.status})\n`;
      });
      greeting += '\n';
    }

    if (context.priorities.length > 0) {
      greeting += `⭐ Prioridades de hoy:\n`;
      context.priorities.slice(0, 3).forEach(priority => {
        greeting += `   • ${priority.title}\n`;
      });
      greeting += '\n';
    }

    if (context.context.nextActions.length > 0) {
      greeting += `🎯 Próximas acciones sugeridas:\n`;
      context.context.nextActions.slice(0, 2).forEach(action => {
        greeting += `   • ${action}\n`;
      });
      greeting += '\n';
    }

    greeting += `¿En qué te puedo ayudar hoy para seguir avanzando hacia tus objetivos?`;

    return greeting;
  }

  logMessage(sender, message) {
    const chatLog = this.userMemory.getChatLog();
    chatLog.messages.push({
      sender,
      message,
      timestamp: new Date().toISOString()
    });
    this.userMemory.saveChatLog(chatLog.messages);
  }

  stop() {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
  }

  // Manual trigger for testing
  triggerMorningGreeting() {
    this.sendMorningGreeting();
  }
}

module.exports = DailyScheduler;