const UserMemory = require('./userMemory');
const DailyScheduler = require('./dailyScheduler');

class AssistantManager {
  constructor() {
    this.userMemory = new UserMemory();
    this.dailyScheduler = new DailyScheduler();
    this.isActive = false;
    this.sessionStartTime = null;
  }

  initialize() {
    console.log('🤖 Inicializando Asistente Personal...');

    this.sessionStartTime = new Date();
    this.isActive = true;

    // Start daily scheduler
    this.dailyScheduler.start();

    // Load user context
    const context = this.userMemory.getDailyContext();

    console.log('✅ Asistente inicializado correctamente');
    console.log(`📊 Estadísticas: ${context.stats.totalDays} días total, racha de ${context.stats.streak} días`);

    return context;
  }

  processUserMessage(message) {
    const timestamp = new Date().toISOString();

    // Log user message
    this.dailyScheduler.logMessage('user', message);

    // Analyze message for context updates
    const contextUpdates = this.analyzeMessage(message);
    if (Object.keys(contextUpdates).length > 0) {
      this.userMemory.updateContext(contextUpdates);
    }

    return {
      timestamp,
      processed: true,
      contextUpdated: Object.keys(contextUpdates).length > 0
    };
  }

  analyzeMessage(message) {
    const updates = {};
    const recentTopics = [];

    // Extract potential projects
    if (message.toLowerCase().includes('proyecto') || message.toLowerCase().includes('project')) {
      recentTopics.push('projects');
    }

    // Extract potential goals
    if (message.toLowerCase().includes('objetivo') || message.toLowerCase().includes('meta') ||
        message.toLowerCase().includes('goal')) {
      recentTopics.push('goals');
    }

    // Extract potential tasks
    if (message.toLowerCase().includes('tarea') || message.toLowerCase().includes('task') ||
        message.toLowerCase().includes('hacer') || message.toLowerCase().includes('completar')) {
      recentTopics.push('tasks');
    }

    if (recentTopics.length > 0) {
      updates.recentTopics = recentTopics;
    }

    return updates;
  }

  sendAssistantMessage(message) {
    // Log assistant message
    this.dailyScheduler.logMessage('assistant', message);

    return {
      timestamp: new Date().toISOString(),
      message,
      logged: true
    };
  }

  addProject(projectData) {
    this.userMemory.addProject(projectData);

    // Update context with new project
    const context = this.userMemory.getDailyContext();
    this.userMemory.updateContext({
      nextActions: [`Continuar trabajando en el proyecto: ${projectData.name}`]
    });

    return context.projects.find(p => p.name === projectData.name);
  }

  updateProject(projectId, updates) {
    this.userMemory.updateProject(projectId, updates);
    return this.userMemory.getDailyContext().projects.find(p => p.id === projectId);
  }

  addPriority(priorityData) {
    this.userMemory.addPriority(priorityData);
    return this.userMemory.getDailyContext().priorities;
  }

  updateUserProfile(profileData) {
    this.userMemory.updateUserInfo(profileData);
    return this.userMemory.getDailyContext().user;
  }

  getDailyContext() {
    return this.userMemory.getDailyContext();
  }

  getChatHistory() {
    return this.userMemory.getChatLog();
  }

  generateDailySummary() {
    const context = this.getDailyContext();
    const chatLog = this.getChatHistory();

    const summary = {
      date: new Date().toDateString(),
      stats: context.stats,
      activeProjects: context.projects.length,
      priorities: context.priorities.length,
      messagesExchanged: chatLog.messages.length,
      topicsDiscussed: context.context.recentTopics,
      achievements: this.analyzeAchievements(chatLog.messages)
    };

    return summary;
  }

  analyzeAchievements(messages) {
    const achievements = [];

    messages.forEach(msg => {
      if (msg.sender === 'user') {
        if (msg.message.toLowerCase().includes('completé') ||
            msg.message.toLowerCase().includes('terminé') ||
            msg.message.toLowerCase().includes('finished')) {
          achievements.push('Tarea completada');
        }
      }
    });

    return achievements;
  }

  // Manual trigger for morning greeting (for testing)
  triggerMorningGreeting() {
    this.dailyScheduler.triggerMorningGreeting();
  }

  shutdown() {
    console.log('🔄 Cerrando sesión del asistente...');

    // Save final context
    const summary = this.generateDailySummary();
    console.log('📊 Resumen del día:', summary);

    // Stop scheduler
    this.dailyScheduler.stop();

    this.isActive = false;
    console.log('✅ Sesión cerrada correctamente');
  }
}

module.exports = AssistantManager;