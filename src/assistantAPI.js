// API client for assistant communication
// Configuración dinámica de API
const getApiBase = () => {
  const hostname = window.location.hostname;

  // En producción (cualquier dominio que no sea localhost)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    console.log('🌐 Modo producción detectado:', hostname);
    return '/api';
  }

  // En desarrollo - usar variable de entorno si está disponible
  const devHost = import.meta.env.VITE_DEV_SERVER_HOST || 'localhost';
  console.log('🔧 Modo desarrollo detectado, usando:', devHost);
  return `http://${devHost}:3001/api`;
};

const API_BASE = getApiBase();
const API_BASE_URL = `${API_BASE}/assistant`;

class AssistantAPI {
  static async getStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      return await response.json();
    } catch (error) {
      console.error('Error getting assistant status:', error);
      return null;
    }
  }

  static async getContext() {
    try {
      const response = await fetch(`${API_BASE_URL}/context`);
      return await response.json();
    } catch (error) {
      console.error('Error getting assistant context:', error);
      return null;
    }
  }

  static async sendUserMessage(message) {
    try {
      const response = await fetch(`${API_BASE_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending user message:', error);
      return null;
    }
  }

  static async sendAssistantResponse(message) {
    try {
      const response = await fetch(`${API_BASE_URL}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending assistant response:', error);
      return null;
    }
  }

  static async addProject(projectData) {
    try {
      const response = await fetch(`${API_BASE_URL}/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding project:', error);
      return null;
    }
  }

  static async updateProject(projectId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  static async addPriority(priorityData) {
    try {
      const response = await fetch(`${API_BASE_URL}/priority`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(priorityData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding priority:', error);
      return null;
    }
  }

  static async updateUserProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  static async getChatHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-history`);
      return await response.json();
    } catch (error) {
      console.error('Error getting chat history:', error);
      return null;
    }
  }

  static async getDailySummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/summary`);
      return await response.json();
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return null;
    }
  }

  static async triggerMorningGreeting() {
    try {
      const response = await fetch(`${API_BASE_URL}/morning-greeting`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Error triggering morning greeting:', error);
      return null;
    }
  }
}

export default AssistantAPI;