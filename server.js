const express = require('express');
const cors = require('cors');
const path = require('path');
const AssistantManager = require('./src/assistantManager');
const { router: authRoutes, authenticateToken } = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize assistant
const assistant = new AssistantManager();
let assistantContext = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Auth routes
app.use('/api/auth', authRoutes);

// Initialize assistant on server start
const initializeAssistant = async () => {
  try {
    assistantContext = assistant.initialize();
    console.log('✅ Asistente inicializado en servidor');
  } catch (error) {
    console.error('❌ Error inicializando asistente:', error);
  }
};

// API Routes (protegidas por autenticación)
app.get('/api/assistant/status', authenticateToken, (req, res) => {
  const context = assistant.getDailyContext();
  res.json({
    active: assistant.isActive,
    context: context,
    sessionStartTime: assistant.sessionStartTime
  });
});

app.get('/api/assistant/context', authenticateToken, (req, res) => {
  const context = assistant.getDailyContext();
  res.json(context);
});

app.post('/api/assistant/message', authenticateToken, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = assistant.processUserMessage(message);
    const context = assistant.getDailyContext();

    res.json({
      processed: result.processed,
      contextUpdated: result.contextUpdated,
      timestamp: result.timestamp,
      context: context
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Error processing message' });
  }
});

app.post('/api/assistant/response', authenticateToken, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = assistant.sendAssistantMessage(message);
    res.json(result);
  } catch (error) {
    console.error('Error sending assistant message:', error);
    res.status(500).json({ error: 'Error sending assistant message' });
  }
});

app.post('/api/assistant/project', authenticateToken, (req, res) => {
  const projectData = req.body;

  try {
    const project = assistant.addProject(projectData);
    res.json(project);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Error adding project' });
  }
});

app.put('/api/assistant/project/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const updates = req.body;

  try {
    const project = assistant.updateProject(projectId, updates);
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error updating project' });
  }
});

app.post('/api/assistant/priority', authenticateToken, (req, res) => {
  const priorityData = req.body;

  try {
    const priorities = assistant.addPriority(priorityData);
    res.json(priorities);
  } catch (error) {
    console.error('Error adding priority:', error);
    res.status(500).json({ error: 'Error adding priority' });
  }
});

app.post('/api/assistant/user', authenticateToken, (req, res) => {
  const profileData = req.body;

  try {
    const user = assistant.updateUserProfile(profileData);
    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error updating user profile' });
  }
});

app.get('/api/assistant/chat-history', authenticateToken, (req, res) => {
  try {
    const chatHistory = assistant.getChatHistory();
    res.json(chatHistory);
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Error getting chat history' });
  }
});

app.get('/api/assistant/summary', authenticateToken, (req, res) => {
  try {
    const summary = assistant.generateDailySummary();
    res.json(summary);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Error generating summary' });
  }
});

app.post('/api/assistant/morning-greeting', authenticateToken, (req, res) => {
  try {
    assistant.triggerMorningGreeting();
    res.json({ message: 'Morning greeting triggered' });
  } catch (error) {
    console.error('Error triggering morning greeting:', error);
    res.status(500).json({ error: 'Error triggering morning greeting' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🔄 Cerrando servidor...');
  assistant.shutdown();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const startServer = async () => {
  await initializeAssistant();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api/assistant/`);
    console.log(`🤖 Asistente programado para saludo matutino a las 6:00 AM`);
  });
};

startServer().catch(error => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

module.exports = app;