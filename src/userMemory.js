class UserMemory {
  constructor() {
    this.memoryFile = './user_memory.json';
    this.chatLogFile = './chat_log.json';
    this.loadMemory();
  }

  loadMemory() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.memoryFile)) {
        const data = fs.readFileSync(this.memoryFile, 'utf8');
        this.memory = JSON.parse(data);
      } else {
        this.memory = this.createDefaultMemory();
        this.saveMemory();
      }
    } catch (error) {
      console.error('Error loading memory:', error);
      this.memory = this.createDefaultMemory();
    }
  }

  createDefaultMemory() {
    return {
      user: {
        name: '',
        preferences: {},
        goals: [],
        motivations: [],
        timezone: 'America/Mexico_City'
      },
      projects: [],
      priorities: [],
      habits: [],
      achievements: [],
      lastInteraction: null,
      dailyStats: {
        streak: 0,
        totalDays: 0,
        lastActiveDate: null
      },
      context: {
        recentTopics: [],
        ongoingTasks: [],
        nextActions: []
      }
    };
  }

  saveMemory() {
    try {
      const fs = require('fs');
      fs.writeFileSync(this.memoryFile, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }

  updateUserInfo(info) {
    this.memory.user = { ...this.memory.user, ...info };
    this.saveMemory();
  }

  addProject(project) {
    this.memory.projects.push({
      id: Date.now(),
      ...project,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    this.saveMemory();
  }

  updateProject(projectId, updates) {
    const projectIndex = this.memory.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      this.memory.projects[projectIndex] = {
        ...this.memory.projects[projectIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveMemory();
    }
  }

  addPriority(priority) {
    this.memory.priorities.push({
      id: Date.now(),
      ...priority,
      createdAt: new Date().toISOString()
    });
    this.saveMemory();
  }

  updateContext(context) {
    this.memory.context = { ...this.memory.context, ...context };
    this.memory.lastInteraction = new Date().toISOString();
    this.saveMemory();
  }

  getDailyContext() {
    const today = new Date().toDateString();
    const lastActiveDate = this.memory.dailyStats.lastActiveDate;

    if (lastActiveDate !== today) {
      this.memory.dailyStats.totalDays++;
      if (this.isConsecutiveDay(lastActiveDate)) {
        this.memory.dailyStats.streak++;
      } else {
        this.memory.dailyStats.streak = 1;
      }
      this.memory.dailyStats.lastActiveDate = today;
      this.saveMemory();
    }

    return {
      user: this.memory.user,
      projects: this.memory.projects.filter(p => p.status === 'active'),
      priorities: this.memory.priorities,
      context: this.memory.context,
      stats: this.memory.dailyStats
    };
  }

  isConsecutiveDay(lastDate) {
    if (!lastDate) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return lastDate === yesterday.toDateString();
  }

  getChatLog() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.chatLogFile)) {
        const data = fs.readFileSync(this.chatLogFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading chat log:', error);
    }
    return { messages: [], date: new Date().toDateString() };
  }

  saveChatLog(messages) {
    try {
      const fs = require('fs');
      const chatLog = {
        date: new Date().toDateString(),
        messages: messages,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.chatLogFile, JSON.stringify(chatLog, null, 2));
    } catch (error) {
      console.error('Error saving chat log:', error);
    }
  }

  clearDailyLog() {
    const today = new Date().toDateString();
    const currentLog = this.getChatLog();

    if (currentLog.date !== today) {
      this.saveChatLog([]);
    }
  }
}

module.exports = UserMemory;