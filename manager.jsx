import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, CheckCircle, Calendar, Target, TrendingUp, Settings, Archive, Play, Trash2, Edit3, Bot, User, MessageCircle, Send, Save, CheckCircle2, Mic, MicOff, Volume2, VolumeX, LogOut, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Auth from './src/components/Auth';
import useAuth from './src/hooks/useAuth';

// Estilos CSS para diseño retro-futurista años 80 synthwave
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600;800&display=swap');

  @keyframes neonGlow {
    0%, 100% {
      text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 15px #ff00ff, 0 0 20px #ff00ff;
    }
    50% {
      text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff;
    }
  }

  @keyframes retroWave {
    0% {
      transform: translateY(0px);
      background-position: 0% 50%;
    }
    50% {
      transform: translateY(-10px);
      background-position: 100% 50%;
    }
    100% {
      transform: translateY(0px);
      background-position: 0% 50%;
    }
  }

  @keyframes synthPulse {
    0%, 100% {
      box-shadow:
        0 0 20px rgba(255, 0, 255, 0.5),
        0 0 40px rgba(255, 0, 255, 0.3),
        inset 0 0 20px rgba(0, 255, 255, 0.1);
    }
    50% {
      box-shadow:
        0 0 30px rgba(0, 255, 255, 0.5),
        0 0 60px rgba(0, 255, 255, 0.3),
        inset 0 0 30px rgba(255, 0, 255, 0.1);
    }
  }

  @keyframes gridFlow {
    0% {
      background-position: 0 0, 0 0;
    }
    100% {
      background-position: 100px 0, 0 100px;
    }
  }

  .retro-font {
    font-family: 'Orbitron', monospace;
    font-weight: 700;
  }

  .synthwave-font {
    font-family: 'Exo 2', sans-serif;
  }

  .neon-border {
    border: 2px solid #ff00ff;
    border-radius: 8px;
    background: linear-gradient(45deg, rgba(255, 0, 255, 0.1), rgba(0, 255, 255, 0.1));
    backdrop-filter: blur(10px);
    animation: synthPulse 3s ease-in-out infinite;
  }

  .retro-grid::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(rgba(255, 0, 255, 0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridFlow 20s linear infinite;
    z-index: -2;
    pointer-events: none;
  }

  .chrome-text {
    background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
    background-size: 400% 400%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: retroWave 4s ease-in-out infinite;
  }

  .miami-glow {
    color: #ff00ff;
    text-shadow:
      0 0 5px #ff00ff,
      0 0 10px #ff00ff,
      0 0 15px #ff00ff,
      0 0 20px #ff00ff,
      0 0 35px #ff00ff;
    animation: neonGlow 2s ease-in-out infinite alternate;
  }

  .cyber-logo {
    background: linear-gradient(135deg, #ff00ff, #00ffff);
    border-radius: 50%;
    box-shadow:
      0 0 20px rgba(255, 0, 255, 0.6),
      0 0 40px rgba(0, 255, 255, 0.4),
      inset 0 0 20px rgba(255, 255, 255, 0.2);
    animation: retroWave 6s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

// Configuración dinámica de API
const getApiBase = () => {
  const hostname = window.location.hostname;

  // En producción (cualquier dominio que no sea localhost)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    console.log('📱 Manager modo producción detectado:', hostname);
    return '/api/auth';
  }

  // En desarrollo - usar variable de entorno si está disponible
  const devHost = import.meta.env.VITE_DEV_SERVER_HOST || 'localhost';
  console.log('🔧 Manager modo desarrollo detectado, usando:', devHost);
  return `http://${devHost}:3001/api/auth`;
};

// Mensajes motivacionales del coach - movido fuera del componente
const coachMessages = [
  "¡Excelente trabajo! Mantén ese momentum 🚀",
  "Cada paso pequeño te acerca a tu meta 💪",
  "Tu constancia es tu superpoder ⭐",
  "Los proyectos no se completan solos, ¡pero tú puedes! 🎯",
  "Prioriza lo importante sobre lo urgente 📈"
];

const PersonalCoachAssistant = () => {
  const { user, loading: authLoading, isAuthenticated, login, logout, authenticatedFetch } = useAuth();

  const [projects, setProjects] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', priority: 'media', deadline: '', description: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [newDailyTask, setNewDailyTask] = useState('');
  const [selectedProjectForTask, setSelectedProjectForTask] = useState('');
  const [selectedProjectTasks, setSelectedProjectTasks] = useState([]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [coachMessage, setCoachMessage] = useState('');

  // Nuevos estados para gestión de tareas de proyectos
  const [newProjectTask, setNewProjectTask] = useState({});
  const [editingProjectTaskId, setEditingProjectTaskId] = useState(null);
  const [editingProjectTaskText, setEditingProjectTaskText] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectDeadlineId, setEditingProjectDeadlineId] = useState(null);
  const [editingProjectDeadlineText, setEditingProjectDeadlineText] = useState('');
  const [editingProjectTitleId, setEditingProjectTitleId] = useState(null);
  const [editingProjectTitleText, setEditingProjectTitleText] = useState('');
  const [editingProjectDescriptionId, setEditingProjectDescriptionId] = useState(null);
  const [editingProjectDescriptionText, setEditingProjectDescriptionText] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [expandedProjectTasks, setExpandedProjectTasks] = useState({});
  const [showActiveProjectsModal, setShowActiveProjectsModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [projectToChangeStatus, setProjectToChangeStatus] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Estados para el asistente
  const [assistantConfig, setAssistantConfig] = useState({
    basePrompt: "Eres mi asistente coach personal para ayudarme a impulsar al máximo todos mis proyectos con éxito. Me vas a ayudar con estrategias, motivación y seguimiento de mis objetivos. Siempre serás directo, práctico y orientado a resultados.",
    systemPrompt: "Eres mi asistente coach personal para ayudarme a impulsar al máximo todos mis proyectos con éxito. Me vas a ayudar con estrategias, motivación y seguimiento de mis objetivos. Siempre serás directo, práctico y orientado a resultados.",
    userName: "",
    assistantName: "Elon Musk",
    specialties: ["Desarrollo de Software"],
    tone: "Motivador",
    focusAreas: {
      proyectos: true,
      tareas: true,
      aprendizaje: false,
      habitos: false
    },
    memory: {
      personalityTraits: "",
      motivationalTriggers: "",
      challengesAndStruggles: "",
      achievements: "",
      learningStyle: "",
      workPatterns: "",
      emotionalContext: "",
      growthAreas: "",
      currentPriorities: ""
    }
  });

  const [customSpecialty, setCustomSpecialty] = useState('');
  const [newCustomSpecialty, setNewCustomSpecialty] = useState('');
  const [showMemorySection, setShowMemorySection] = useState(false);
  const [availableSpecialties, setAvailableSpecialties] = useState([
    "Desarrollo de Software",
    "Estrategias de Marketing",
    "Productividad Personal",
    "Gestión de Proyectos",
    "Emprendimiento",
    "Finanzas Personales",
    "Diseño UX/UI",
    "Ventas y Negociación",
    "Recursos Humanos",
    "Análisis de Datos",
    "Transformación Digital"
  ]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: '¡Hola! Soy Elon Musk, tu asistente coach personal. Tengo experiencia en múltiples áreas para ayudarte a impulsar al máximo todos tus proyectos con éxito. Vamos a hacer que las cosas sucedan. ¿En qué proyecto quieres enfocarte hoy?',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString()
    },
    {
      id: 2,
      type: 'user',
      content: 'Necesito ayuda para organizar mejor mis proyectos y ser más productivo',
      timestamp: new Date(Date.now() - 240000).toLocaleTimeString()
    },
    {
      id: 3,
      type: 'assistant',
      content: 'Perfecto. La productividad se trata de enfoque y ejecución sistemática. Basándome en mis especialidades, puedo ayudarte desde múltiples perspectivas. Te recomiendo identificar los 3 proyectos que tendrán mayor impacto. ¿Cuáles son esos proyectos clave y en qué área necesitas más apoyo?',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString()
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isConfigSaved, setIsConfigSaved] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  // Función para obtener estilos del theme
  const getThemeStyles = (theme) => {
    switch (theme) {
      case 'retro':
        return {
          background: `
            radial-gradient(ellipse at top, #ff00ff22 0%, transparent 70%),
            radial-gradient(ellipse at bottom, #00ffff22 0%, transparent 70%),
            linear-gradient(180deg, #0a0014 0%, #1a0033 50%, #2a1458 100%)
          `,
          className: 'retro-grid synthwave-font'
        };
      case 'minimal':
        return {
          background: `
            linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%),
            radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `,
          className: 'synthwave-font'
        };
      case 'brutalist':
        return {
          background: 'linear-gradient(45deg, #ffffff 25%, #f8f9fa 25%, #f8f9fa 50%, #ffffff 50%, #ffffff 75%, #f8f9fa 75%)',
          backgroundSize: '60px 60px',
          className: 'data-grid system-font'
        };
      case 'colorful':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
          className: 'synthwave-font'
        };
      default:
        return {
          background: `
            radial-gradient(ellipse at top, #ff00ff22 0%, transparent 70%),
            radial-gradient(ellipse at bottom, #00ffff22 0%, transparent 70%),
            linear-gradient(180deg, #0a0014 0%, #1a0033 50%, #2a1458 100%)
          `,
          className: 'retro-grid synthwave-font'
        };
    }
  };

  // Función para obtener estilos del header según el theme
  const getHeaderStyles = (theme) => {
    switch (theme) {
      case 'retro':
        return {
          background: 'linear-gradient(90deg, rgba(26, 0, 51, 0.9), rgba(42, 20, 88, 0.9))',
          borderBottom: '3px solid #ff00ff',
          className: 'neon-border',
          titleStyle: {
            background: 'linear-gradient(90deg, #00ffff 0%, #ff00ff 25%, #ffff00 50%, #ff00ff 75%, #00ffff 100%)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            animation: 'retroWave 4s ease-in-out infinite',
            letterSpacing: '0.15em',
            // Fallback en caso de que el clip no funcione
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
          },
          subtitleStyle: {
            color: '#f8f9fa',
            textShadow: '0 0 3px rgba(255, 255, 255, 0.2)',
            opacity: 0.9
          },
          userStyle: {
            color: '#00ffff',
            textShadow: '0 0 10px #00ffff'
          },
          emailStyle: {
            color: '#ff00ff',
            textShadow: '0 0 8px #ff00ff'
          }
        };
      case 'minimal':
        return {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderBottom: 'none',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          className: 'glass-morphism',
          titleStyle: {
            color: '#667eea',
            textShadow: '0 1px 2px rgba(102, 126, 234, 0.3)'
          },
          subtitleStyle: {
            color: '#64748b',
            fontWeight: 'light'
          },
          userStyle: {
            color: '#374151',
            fontWeight: 'medium'
          },
          emailStyle: {
            color: '#6b7280',
            fontWeight: 'light'
          }
        };
      case 'brutalist':
        return {
          background: '#000000',
          color: '#00ff80',
          borderBottom: '4px solid #ff0080',
          className: 'terminal-font',
          titleStyle: {
            color: '#ff0080',
            textShadow: '2px 2px 0px #000000',
            letterSpacing: '0.1em'
          },
          subtitleStyle: {
            color: '#00ff80',
            fontWeight: '700'
          },
          userStyle: {
            color: '#ffff00',
            fontWeight: '700'
          },
          emailStyle: {
            color: '#00ff80'
          }
        };
      case 'colorful':
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          className: '',
          titleStyle: {
            color: 'white',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          },
          subtitleStyle: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          userStyle: {
            color: 'white'
          },
          emailStyle: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        };
      default:
        return {
          background: 'linear-gradient(90deg, rgba(26, 0, 51, 0.9), rgba(42, 20, 88, 0.9))',
          borderBottom: '3px solid #ff00ff',
          className: 'neon-border'
        };
    }
  };
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedConfigSection, setSelectedConfigSection] = useState('');

  // Estados para modales y dropdown
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('smartchatix-theme') || 'retro';
  });
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showMemoryFields, setShowMemoryFields] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para configuración del usuario
  const [userConfig, setUserConfig] = useState({
    name: user?.name || '',
    email: user?.email || '',
    newPassword: '',
    confirmPassword: ''
  });

  const messagesEndRef = useRef(null);

  // Estados para funciones de voz
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecordingComplete, setIsRecordingComplete] = useState(false);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const randomMessage = coachMessages[Math.floor(Math.random() * coachMessages.length)];
    setCoachMessage(randomMessage);
  }, []);

  // Función para cargar datos específicos del usuario
  const loadUserData = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${getApiBase()}/profile`);
      if (response.ok) {
        const data = await response.json();

        // Cargar proyectos del usuario
        setProjects(data.projects || []);

        // Cargar tareas diarias del usuario
        setDailyTasks(data.dailyTasks || []);

        // Cargar configuración del asistente
        if (data.assistantConfig) {
          setAssistantConfig({
            basePrompt: data.assistantConfig.base_prompt,
            systemPrompt: data.assistantConfig.system_prompt,
            userName: data.assistantConfig.user_name,
            assistantName: data.assistantConfig.assistant_name,
            specialties: data.assistantConfig.specialties || [],
            tone: data.assistantConfig.tone,
            focusAreas: data.assistantConfig.focus_areas || {},
            memory: data.assistantConfig.memory || {},
            voiceEnabled: data.assistantConfig.voice_enabled !== 0
          });
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  }, [authenticatedFetch]);

  // Cargar datos del usuario al autenticarse
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user]); // Removed loadUserData from dependencies to prevent infinite loop

  // Recalcular progreso cuando cambien las tareas de los proyectos
  // Removed problematic useEffect that was causing infinite loops
  // Progress calculation is now handled directly in task operations

  // Scroll automático al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar soporte de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Limpiar timeout al terminar
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        // Finalizar el texto acumulado
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          setNewMessage(finalText);
        }
        finalTranscriptRef.current = '';
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Acumular el texto final
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript + ' ';
        }

        // Mostrar el texto acumulado + el texto temporal
        const fullText = (finalTranscriptRef.current + interimTranscript).trim();
        setNewMessage(fullText);

        // Resetear timeout para detener grabación después de pausa
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          console.log('Timeout reseteado - nueva actividad detectada');
        }

        // Si no hay actividad por 2 segundos, terminar la grabación
        timeoutRef.current = setTimeout(() => {
          console.log('Timeout ejecutado - deteniendo reconocimiento');
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (error) {
              console.log('Reconocimiento ya detenido');
            }
          }
        }, 2000);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error);
        setIsListening(false);
        finalTranscriptRef.current = '';
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    // Verificar soporte de síntesis de voz
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Funciones de voz
  const startListening = () => {
    if (recognitionRef.current && speechSupported && !isListening) {
      try {
        // Limpiar texto acumulado al iniciar nueva grabación
        finalTranscriptRef.current = '';
        setNewMessage('');
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error al iniciar reconocimiento de voz:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Finalizar el texto acumulado
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        setNewMessage(finalText);
      }
      finalTranscriptRef.current = '';
    }
  };

  const speakText = (text) => {
    if (!voiceEnabled || !synthesisRef.current) return;

    // Detener cualquier síntesis anterior
    synthesisRef.current.cancel();

    // Dividir el texto en fragmentos más pequeños para evitar cortes
    const maxLength = 200; // Caracteres máximos por fragmento
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    });

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    setIsSpeaking(true);

    // Función para hablar cada fragmento secuencialmente
    const speakChunks = (chunkIndex = 0) => {
      if (chunkIndex >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        // Pequeña pausa entre fragmentos
        setTimeout(() => {
          speakChunks(chunkIndex + 1);
        }, 100);
      };

      utterance.onerror = () => {
        console.error('Error en síntesis de voz, fragmento:', chunkIndex);
        setIsSpeaking(false);
      };

      synthesisRef.current.speak(utterance);
    };

    // Iniciar la síntesis con el primer fragmento
    speakChunks(0);
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      // Forzar parada inmediata
      setTimeout(() => {
        if (synthesisRef.current) {
          synthesisRef.current.cancel();
        }
        setIsSpeaking(false);
      }, 100);
    }
  };

  const addProject = async () => {
    if (newProject.title.trim()) {
      try {
        const projectData = {
          ...newProject,
          status: 'activo',
          progress: 0,
          createdAt: new Date().toLocaleDateString(),
          tasks: []
        };

        const response = await authenticatedFetch(`${getApiBase()}/projects`, {
          method: 'POST',
          body: JSON.stringify({ project: projectData })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Actualizar estado local con el proyecto guardado
            setProjects([...projects, { ...data.project, tasks: [] }]);
            setNewProject({ title: '', priority: 'media', deadline: '', description: '' });
            setShowCreateProject(false);
          }
        }
      } catch (error) {
        console.error('Error guardando proyecto:', error);
        // Fallback: guardar localmente si hay error de conexión
        const project = {
          id: Date.now(),
          ...newProject,
          status: 'activo',
          progress: 0,
          createdAt: new Date().toLocaleDateString(),
          tasks: []
        };
        setProjects([...projects, project]);
        setNewProject({ title: '', priority: 'media', deadline: '', description: '' });
        setShowCreateProject(false);
      }
    }
  };

  const updateProjectProgress = (projectId, progress) => {
    setProjects(projects.map(project =>
      project.id === projectId ? { ...project, progress: Math.min(100, progress) } : project
    ));
  };

  const openStatusModal = (project) => {
    setProjectToChangeStatus(project);
    setShowStatusModal(true);
  };

  const changeProjectStatus = (newStatus) => {
    if (projectToChangeStatus) {
      setProjects(projects.map(project =>
        project.id === projectToChangeStatus.id
          ? { ...project, status: newStatus }
          : project
      ));
      setShowStatusModal(false);
      setProjectToChangeStatus(null);
    }
  };

  const archiveProject = (projectId) => {
    setProjects(projects.map(project =>
      project.id === projectId ? { ...project, status: 'completado' } : project
    ));
  };

  const deleteProject = async (projectId) => {
    console.log('🔥 INICIANDO ELIMINACIÓN DE PROYECTO:', projectId);
    try {
      // Eliminar del backend primero
      const deleteUrl = `${getApiBase()}/projects/${projectId}`;
      console.log('🗑️ Eliminando proyecto con URL:', deleteUrl);

      const response = await authenticatedFetch(deleteUrl, {
        method: 'DELETE'
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error al eliminar proyecto del servidor: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Respuesta exitosa del servidor:', result);

      // Si la eliminación en el backend fue exitosa, actualizar el estado local
      setProjects(projects.filter(project => project.id !== projectId));

      // Eliminar cualquier tarea diaria vinculada a este proyecto
      setDailyTasks(dailyTasks.filter(task => task.projectId !== projectId));

      console.log('✅ Proyecto eliminado exitosamente del frontend');
    } catch (error) {
      console.error('❌ Error eliminando proyecto:', error);
      alert(`Error al eliminar el proyecto: ${error.message}`);
    }
  };

  const startEditingProjectDeadline = (projectId, currentDeadline) => {
    setEditingProjectDeadlineId(projectId);
    setEditingProjectDeadlineText(currentDeadline || '');
  };

  const saveProjectDeadline = () => {
    if (editingProjectDeadlineId !== null) {
      setProjects(projects.map(project => {
        if (project.id === editingProjectDeadlineId) {
          return { ...project, deadline: editingProjectDeadlineText.trim() || null };
        }
        return project;
      }));
    }
    setEditingProjectDeadlineId(null);
    setEditingProjectDeadlineText('');
  };

  const cancelEditingProjectDeadline = () => {
    setEditingProjectDeadlineId(null);
    setEditingProjectDeadlineText('');
  };

  // Funciones para editar título del proyecto
  const startEditingProjectTitle = (projectId, currentTitle) => {
    setEditingProjectTitleId(projectId);
    setEditingProjectTitleText(currentTitle || '');
  };

  const saveProjectTitle = () => {
    if (editingProjectTitleId !== null && editingProjectTitleText.trim()) {
      setProjects(projects.map(project => {
        if (project.id === editingProjectTitleId) {
          return { ...project, title: editingProjectTitleText.trim() };
        }
        return project;
      }));
    }
    setEditingProjectTitleId(null);
    setEditingProjectTitleText('');
  };

  const cancelEditingProjectTitle = () => {
    setEditingProjectTitleId(null);
    setEditingProjectTitleText('');
  };

  // Funciones para editar descripción del proyecto
  const startEditingProjectDescription = (projectId, currentDescription) => {
    setEditingProjectDescriptionId(projectId);
    setEditingProjectDescriptionText(currentDescription || '');
  };

  const saveProjectDescription = () => {
    if (editingProjectDescriptionId !== null) {
      setProjects(projects.map(project => {
        if (project.id === editingProjectDescriptionId) {
          return { ...project, description: editingProjectDescriptionText.trim() || null };
        }
        return project;
      }));
    }
    setEditingProjectDescriptionId(null);
    setEditingProjectDescriptionText('');
  };

  const cancelEditingProjectDescription = () => {
    setEditingProjectDescriptionId(null);
    setEditingProjectDescriptionText('');
  };

  // Función para expandir/colapsar tareas del proyecto
  const toggleProjectTasks = (projectId) => {
    setExpandedProjectTasks(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Función para abrir modal de detalle de proyecto
  const openProjectDetail = (project) => {
    setSelectedProject(project);
    setShowProjectDetailModal(true);
  };


  // Funciones para gestión de tareas de proyectos
  const addProjectTask = async (projectId) => {
    const taskText = newProjectTask[projectId];
    if (taskText && taskText.trim()) {
      try {
        const task = {
          title: taskText.trim(),
          description: '',
          completed: false,
          progress: 0,
          createdAt: new Date().toLocaleDateString()
        };

        // Guardar en la base de datos
        const response = await authenticatedFetch(`${getApiBase()}/project-tasks`, {
          method: 'POST',
          body: JSON.stringify({
            projectId: projectId,
            task: task
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Actualizar estado local con la tarea guardada usando functional update
            setProjects(prevProjects => {
              const updatedProjects = prevProjects.map(project =>
                project.id === projectId
                  ? { ...project, tasks: [...project.tasks, { ...task, id: data.task.id }] }
                  : project
              );

              // Actualizar progreso después de agregar la tarea
              const targetProject = updatedProjects.find(p => p.id === projectId);
              if (targetProject && targetProject.tasks.length > 0) {
                const totalProgress = targetProject.tasks.reduce((sum, task) => sum + task.progress, 0);
                const averageProgress = Math.round(totalProgress / targetProject.tasks.length);
                return updatedProjects.map(p =>
                  p.id === projectId ? { ...p, progress: averageProgress } : p
                );
              }
              return updatedProjects;
            });

            // También actualizar selectedProject si el modal está abierto para este proyecto
            if (selectedProject && selectedProject.id === projectId) {
              setSelectedProject(prev => ({
                ...prev,
                tasks: [...prev.tasks, { ...task, id: data.task.id }]
              }));
            }

            setNewProjectTask(prev => ({ ...prev, [projectId]: '' }));
          }
        }
      } catch (error) {
        console.error('Error guardando tarea del proyecto:', error);
        // Fallback: guardar localmente si hay error
        const task = {
          id: Date.now(),
          title: taskText.trim(),
          description: '',
          completed: false,
          progress: 0,
          createdAt: new Date().toLocaleDateString()
        };

        setProjects(prevProjects => {
          const updatedProjects = prevProjects.map(project =>
            project.id === projectId
              ? { ...project, tasks: [...project.tasks, task] }
              : project
          );

          // Actualizar progreso después de agregar la tarea
          const targetProject = updatedProjects.find(p => p.id === projectId);
          if (targetProject && targetProject.tasks.length > 0) {
            const totalProgress = targetProject.tasks.reduce((sum, task) => sum + task.progress, 0);
            const averageProgress = Math.round(totalProgress / targetProject.tasks.length);
            return updatedProjects.map(p =>
              p.id === projectId ? { ...p, progress: averageProgress } : p
            );
          }
          return updatedProjects;
        });

        // También actualizar selectedProject si el modal está abierto para este proyecto (fallback)
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(prev => ({
            ...prev,
            tasks: [...prev.tasks, task]
          }));
        }

        setNewProjectTask(prev => ({ ...prev, [projectId]: '' }));
      }
    }
  };

  const toggleProjectTask = (projectId, taskId) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId) {
            const newCompleted = !task.completed;
            return {
              ...task,
              completed: newCompleted,
              progress: newCompleted ? 100 : task.progress
            };
          }
          return task;
        });
        return { ...project, tasks: updatedTasks };
      }
      return project;
    }));

    // Sincronizar con tareas diarias
    setDailyTasks(dailyTasks.map(task => {
      if (task.projectId === projectId && task.projectTaskId === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    }));

    updateProjectProgressFromTasks(projectId);
  };

  const toggleProjectTaskCompletion = (projectId, taskId, completed) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              completed: completed,
              progress: completed ? 100 : task.progress
            };
          }
          return task;
        });
        return { ...project, tasks: updatedTasks };
      }
      return project;
    }));

    // Sincronizar con tareas diarias
    setDailyTasks(dailyTasks.map(task => {
      if (task.projectId === projectId && task.projectTaskId === taskId) {
        return { ...task, completed: completed };
      }
      return task;
    }));

    // Actualizar selectedProject si está abierto en el modal
    if (selectedProject && selectedProject.id === projectId) {
      const updatedTasks = selectedProject.tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            completed: completed,
            progress: completed ? 100 : task.progress
          };
        }
        return task;
      });
      setSelectedProject({ ...selectedProject, tasks: updatedTasks });
    }

    updateProjectProgressFromTasks(projectId);
  };

  const addProjectTaskToDaily = (projectId, task) => {
    const existingDailyTask = dailyTasks.find(dt =>
      dt.projectId === projectId && dt.projectTaskId === task.id
    );

    if (!existingDailyTask) {
      const dailyTask = {
        id: Date.now(),
        text: task.title,
        completed: task.completed,
        createdAt: new Date().toLocaleDateString(),
        projectId: projectId,
        projectTaskId: task.id
      };
      setDailyTasks([...dailyTasks, dailyTask]);

      // Actualizar la lista de tareas disponibles si es el proyecto seleccionado
      if (selectedProjectForTask && selectedProjectForTask === projectId) {
        const updatedTasks = selectedProjectTasks.filter(t => t.id !== task.id);
        setSelectedProjectTasks(updatedTasks);
      }
    }
  };

  const addDailyTask = async () => {
    if (!newDailyTask.trim()) return;

    const task = {
      id: Date.now(),
      text: newDailyTask.trim(),
      completed: false,
      projectId: selectedProjectForTask || null,
      projectTaskId: null
    };

    try {
      const response = await authenticatedFetch(`${getApiBase()}/daily-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      if (response.ok) {
        setDailyTasks([...dailyTasks, task]);
        setNewDailyTask('');
        setSelectedProjectForTask('');
      } else {
        console.error('Error al guardar tarea diaria');
      }
    } catch (error) {
      console.error('Error:', error);
      // Si falla la petición, al menos actualizar localmente
      setDailyTasks([...dailyTasks, task]);
      setNewDailyTask('');
      setSelectedProjectForTask('');
    }
  };

  const updateProjectProgressFromTasks = (projectId) => {
    setProjects(prevProjects => {
      const project = prevProjects.find(p => p.id === projectId);
      if (project && project.tasks.length > 0) {
        // Calcular progreso como promedio de los porcentajes de todas las tareas
        const totalProgress = project.tasks.reduce((sum, task) => sum + task.progress, 0);
        const averageProgress = Math.round(totalProgress / project.tasks.length);

        // Actualizar también el selectedProject si es el mismo proyecto
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(prev => ({ ...prev, progress: averageProgress }));
        }

        return prevProjects.map(p =>
          p.id === projectId ? { ...p, progress: averageProgress } : p
        );
      }
      return prevProjects;
    });
  };

  // Funciones para editar tareas de proyectos
  const startEditingProjectTask = (projectId, taskId, taskTitle) => {
    setEditingProjectId(projectId);
    setEditingProjectTaskId(taskId);
    setEditingProjectTaskText(taskTitle);
  };

  const saveEditedProjectTask = () => {
    if (editingProjectTaskText.trim()) {
      setProjects(projects.map(project => {
        if (project.id === editingProjectId) {
          const updatedTasks = project.tasks.map(task =>
            task.id === editingProjectTaskId
              ? { ...task, title: editingProjectTaskText.trim() }
              : task
          );
          return { ...project, tasks: updatedTasks };
        }
        return project;
      }));

      // Sincronizar con tareas diarias
      setDailyTasks(dailyTasks.map(task => {
        if (task.projectId === editingProjectId && task.projectTaskId === editingProjectTaskId) {
          return { ...task, text: editingProjectTaskText.trim() };
        }
        return task;
      }));

      // Actualizar selectedProject si está abierto en el modal
      if (selectedProject && selectedProject.id === editingProjectId) {
        const updatedTasks = selectedProject.tasks.map(task =>
          task.id === editingProjectTaskId
            ? { ...task, title: editingProjectTaskText.trim() }
            : task
        );
        setSelectedProject({ ...selectedProject, tasks: updatedTasks });
      }
    }
    setEditingProjectId(null);
    setEditingProjectTaskId(null);
    setEditingProjectTaskText('');
  };

  const cancelEditingProjectTask = () => {
    setEditingProjectId(null);
    setEditingProjectTaskId(null);
    setEditingProjectTaskText('');
  };


  const deleteProjectTask = async (projectId, taskId) => {
    try {
      // Eliminar de la base de datos primero
      const deleteUrl = `${getApiBase()}/project-tasks/${taskId}`;
      console.log('🗑️ Eliminando tarea con URL:', deleteUrl);
      const response = await authenticatedFetch(deleteUrl, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error('Error eliminando tarea del servidor');
        return;
      }

      // Si la eliminación del servidor fue exitosa, actualizar el estado local
      // Eliminar de proyecto
      setProjects(projects.map(project => {
        if (project.id === projectId) {
          const updatedTasks = project.tasks.filter(task => task.id !== taskId);
          return { ...project, tasks: updatedTasks };
        }
        return project;
      }));

      // Eliminar de tareas diarias si existe
      setDailyTasks(dailyTasks.filter(task =>
        !(task.projectId === projectId && task.projectTaskId === taskId)
      ));

      // Actualizar selectedProject si está abierto en el modal
      if (selectedProject && selectedProject.id === projectId) {
        const updatedTasks = selectedProject.tasks.filter(task => task.id !== taskId);
        setSelectedProject({ ...selectedProject, tasks: updatedTasks });
      }

      updateProjectProgressFromTasks(projectId);
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  // Función para actualizar el porcentaje de progreso de una tarea
  const updateTaskProgress = (projectId, taskId, newProgress) => {
    const progressValue = Math.max(0, Math.min(100, parseInt(newProgress) || 0));

    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              progress: progressValue,
              completed: progressValue === 100
            };
          }
          return task;
        });
        return { ...project, tasks: updatedTasks };
      }
      return project;
    }));

    // Sincronizar con tareas diarias si existe
    setDailyTasks(dailyTasks.map(task => {
      if (task.projectId === projectId && task.projectTaskId === taskId) {
        return { ...task, completed: progressValue === 100 };
      }
      return task;
    }));

    updateProjectProgressFromTasks(projectId);

    // Actualizar también el proyecto seleccionado para el modal
    if (selectedProject && selectedProject.id === projectId) {
      const updatedTasks = selectedProject.tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            progress: progressValue,
            completed: progressValue === 100
          };
        }
        return task;
      });

      const totalProgress = updatedTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      const averageProgress = updatedTasks.length > 0 ? Math.round(totalProgress / updatedTasks.length) : 0;

      setSelectedProject({ ...selectedProject, tasks: updatedTasks, progress: averageProgress });
    }
  };

  const startEditingTaskName = (taskId, currentName) => {
    setEditingProjectTaskId(taskId);
    setEditingProjectTaskText(currentName);
  };

  const saveTaskName = () => {
    if (editingProjectTaskId && editingProjectTaskText.trim()) {
      setProjects(projects.map(project => ({
        ...project,
        tasks: project.tasks.map(task =>
          task.id === editingProjectTaskId
            ? { ...task, text: editingProjectTaskText.trim(), title: editingProjectTaskText.trim() }
            : task
        )
      })));

      // También actualizar selectedProject si es el que estamos editando
      if (selectedProject) {
        const updatedTasks = selectedProject.tasks.map(task =>
          task.id === editingProjectTaskId
            ? { ...task, text: editingProjectTaskText.trim(), title: editingProjectTaskText.trim() }
            : task
        );
        setSelectedProject({ ...selectedProject, tasks: updatedTasks });
      }

      setEditingProjectTaskId(null);
      setEditingProjectTaskText('');
    }
  };

  const cancelEditingTaskName = () => {
    setEditingProjectTaskId(null);
    setEditingProjectTaskText('');
  };

  const addTaskFromModal = async (projectId) => {
    console.log('🎯 EJECUTANDO addTaskFromModal:', { projectId, newTaskText });
    if (newTaskText && newTaskText.trim()) {
      try {
        const task = {
          title: newTaskText.trim(),
          text: newTaskText.trim(),
          description: '',
          completed: false,
          progress: 0,
          createdAt: new Date().toLocaleDateString(),
          id: Date.now() // Temporary ID
        };

        // Actualizar estado local inmediatamente
        setProjects(prevProjects => {
          const updatedProjects = prevProjects.map(project =>
            project.id === projectId
              ? { ...project, tasks: [...(project.tasks || []), task] }
              : project
          );
          return updatedProjects;
        });

        // También actualizar selectedProject si es el que estamos editando
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject({
            ...selectedProject,
            tasks: [...(selectedProject.tasks || []), task]
          });
        }

        // Limpiar el input y salir del modo edición
        setNewTaskText('');
        setIsAddingTask(false);
        console.log('✅ Tarea agregada localmente, input limpiado');

        // Opcional: guardar en base de datos en segundo plano
        try {
          const response = await authenticatedFetch(`${getApiBase()}/project-tasks`, {
            method: 'POST',
            body: JSON.stringify({
              projectId: projectId,
              task: task
            })
          });

          if (response.ok) {
            const data = await response.json();
            // Actualizar con el ID real de la base de datos
            if (data.success && data.task.id !== task.id) {
              setProjects(prevProjects => {
                return prevProjects.map(project =>
                  project.id === projectId
                    ? {
                        ...project,
                        tasks: project.tasks.map(t =>
                          t.id === task.id ? { ...t, id: data.task.id } : t
                        )
                      }
                    : project
                );
              });

              if (selectedProject && selectedProject.id === projectId) {
                setSelectedProject({
                  ...selectedProject,
                  tasks: selectedProject.tasks.map(t =>
                    t.id === task.id ? { ...t, id: data.task.id } : t
                  )
                });
              }
            }
          }
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // La tarea ya está en el estado local, así que no hay problema
        }

      } catch (error) {
        console.error('Error adding task:', error);
        alert('Error al agregar la tarea');
      }
    }
  };

  // Funciones para el asistente
  const toneOptions = [
    { value: 'Motivador', label: 'Motivador' },
    { value: 'Formal', label: 'Formal' },
    { value: 'Amigable', label: 'Amigable' },
    { value: 'Crítico', label: 'Crítico' }
  ];

  const focusAreasOptions = [
    { key: 'proyectos', label: 'Proyectos' },
    { key: 'tareas', label: 'Tareas' },
    { key: 'aprendizaje', label: 'Aprendizaje' },
    { key: 'habitos', label: 'Hábitos diarios' }
  ];

  const handleConfigChange = (field, value) => {
    setAssistantConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFocusAreaChange = (area) => {
    setAssistantConfig(prev => ({
      ...prev,
      focusAreas: {
        ...prev.focusAreas,
        [area]: !prev.focusAreas[area]
      }
    }));
  };

  // Funciones para manejar especialidades múltiples
  const handleSpecialtyToggle = (specialty) => {
    setAssistantConfig(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const addCustomSpecialty = () => {
    if (newCustomSpecialty.trim() && !availableSpecialties.includes(newCustomSpecialty.trim())) {
      const newSpecialty = newCustomSpecialty.trim();
      setAvailableSpecialties(prev => [...prev, newSpecialty]);
      setAssistantConfig(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty]
      }));
      setNewCustomSpecialty('');
    }
  };

  const removeSpecialty = (specialty) => {
    setAssistantConfig(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const updateMemory = (field, value) => {
    setAssistantConfig(prev => ({
      ...prev,
      memory: {
        ...prev.memory,
        [field]: value
      }
    }));
  };

  // Funciones que el asistente puede ejecutar
  const assistantFunctions = [
    {
      name: "create_project",
      description: "Crear un nuevo proyecto con título, descripción opcional, prioridad y fecha límite opcional",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título del proyecto"
          },
          description: {
            type: "string",
            description: "Descripción opcional del proyecto"
          },
          priority: {
            type: "string",
            enum: ["baja", "media", "alta"],
            description: "Prioridad del proyecto"
          },
          deadline: {
            type: "string",
            description: "Fecha límite en formato YYYY-MM-DD (opcional)"
          }
        },
        required: ["title", "priority"]
      }
    },
    {
      name: "add_project_task",
      description: "Agregar una nueva tarea a un proyecto existente",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título del proyecto al que agregar la tarea"
          },
          task_title: {
            type: "string",
            description: "Título de la nueva tarea"
          },
          description: {
            type: "string",
            description: "Descripción opcional de la tarea"
          }
        },
        required: ["project_title", "task_title"]
      }
    },
    {
      name: "update_task_progress",
      description: "Actualizar el porcentaje de progreso de una tarea específica",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título del proyecto que contiene la tarea"
          },
          task_title: {
            type: "string",
            description: "Título de la tarea a actualizar"
          },
          progress: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Nuevo porcentaje de progreso (0-100)"
          }
        },
        required: ["project_title", "task_title", "progress"]
      }
    },
    {
      name: "add_task_to_daily_focus",
      description: "Agregar una tarea de proyecto al enfoque diario",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título del proyecto"
          },
          task_title: {
            type: "string",
            description: "Título de la tarea a agregar al enfoque diario"
          }
        },
        required: ["project_title", "task_title"]
      }
    },
    {
      name: "get_projects_status",
      description: "Obtener información sobre todos los proyectos y su estado actual",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ];

  // Función para ejecutar las acciones del asistente
  const executeAssistantFunction = (functionName, parameters) => {
    switch (functionName) {
      case "create_project":
        return createProjectFromAssistant(parameters);
      case "add_project_task":
        return addProjectTaskFromAssistant(parameters);
      case "update_task_progress":
        return updateTaskProgressFromAssistant(parameters);
      case "add_task_to_daily_focus":
        return addTaskToDailyFocusFromAssistant(parameters);
      case "get_projects_status":
        return getProjectsStatusFromAssistant();
      default:
        return { success: false, message: "Función no reconocida" };
    }
  };

  // Implementaciones de las funciones del asistente
  const createProjectFromAssistant = (params) => {
    try {
      const project = {
        id: Date.now(),
        title: params.title,
        description: params.description || '',
        priority: params.priority,
        deadline: params.deadline || '',
        status: 'activo',
        progress: 0,
        createdAt: new Date().toLocaleDateString(),
        tasks: []
      };
      setProjects(prev => [...prev, project]);

      // Mensajes motivadores personalizados según la prioridad
      let motivationalMessage = "";
      switch (params.priority) {
        case 'alta':
          motivationalMessage = "¡Excelente! Este proyecto tiene prioridad alta, así que vamos a darle toda la atención que merece. ";
          break;
        case 'media':
          motivationalMessage = "¡Perfecto! Un proyecto con prioridad media nos da espacio para planificar bien. ";
          break;
        case 'baja':
          motivationalMessage = "¡Genial! Este proyecto con prioridad baja será perfecto para avanzar de manera constante. ";
          break;
      }

      const deadlineMessage = params.deadline
        ? `Con fecha límite para el ${new Date(params.deadline).toLocaleDateString()}, `
        : "";

      return {
        success: true,
        message: `¡Listo! 🚀 He creado el proyecto "${params.title}" con prioridad ${params.priority}. ${deadlineMessage}${motivationalMessage}

¡Ahora vamos a poblarlo de tareas para que puedas comenzar a ejecutar! ¿Qué tareas específicas necesitas para este proyecto? Puedes decirme varias y las agrego todas de una vez.

💡 Por ejemplo: "Agrega las tareas: investigar tecnologías, crear mockups, desarrollar MVP"`,
        project_id: project.id
      };
    } catch (error) {
      return { success: false, message: "Error al crear el proyecto: " + error.message };
    }
  };

  const addProjectTaskFromAssistant = (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}". ¿Quieres que primero creemos ese proyecto?` };
      }

      const task = {
        id: Date.now(),
        title: params.task_title,
        description: params.description || '',
        completed: false,
        progress: 0,
        createdAt: new Date().toLocaleDateString()
      };

      setProjects(prev => prev.map(p =>
        p.id === project.id
          ? { ...p, tasks: [...p.tasks, task] }
          : p
      ));

      const taskCount = project.tasks.length + 1; // +1 porque acabamos de agregar una
      const encouragement = taskCount === 1
        ? "¡Excelente! Ya tienes la primera tarea de tu proyecto. "
        : `¡Genial! Ya tienes ${taskCount} tareas en este proyecto. `;

      return {
        success: true,
        message: `✅ ${encouragement}He agregado "${params.task_title}" al proyecto "${project.title}".

🎯 ¿Te gustaría que la agregue a tu enfoque de hoy para comenzar a trabajar en ella? O si tienes más tareas en mente, ¡sigue diciéndomelas!`,
        task_id: task.id
      };
    } catch (error) {
      return { success: false, message: "Error al agregar la tarea: " + error.message };
    }
  };

  const updateTaskProgressFromAssistant = (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      const task = project.tasks.find(t => t.title.toLowerCase().includes(params.task_title.toLowerCase()));
      if (!task) {
        return { success: false, message: `No se encontró la tarea "${params.task_title}" en el proyecto "${project.title}".` };
      }

      updateTaskProgress(project.id, task.id, params.progress);

      // Mensajes motivacionales según el progreso
      let progressMessage = "";
      if (params.progress === 100) {
        progressMessage = "¡Increíble! 🎉 Has completado esta tarea al 100%. ¡Eso es lo que llamo ejecución perfecta!";
      } else if (params.progress >= 75) {
        progressMessage = "¡Excelente progreso! 🚀 Ya estás en la recta final con este 75%+. ¡Sigue así!";
      } else if (params.progress >= 50) {
        progressMessage = "¡Vas por buen camino! 💪 Ya tienes más de la mitad completada.";
      } else if (params.progress >= 25) {
        progressMessage = "¡Buen inicio! 👍 Ya tienes una base sólida con este avance.";
      } else {
        progressMessage = "¡Perfecto! 🎯 Todo gran proyecto comienza con el primer paso.";
      }

      return {
        success: true,
        message: `✅ ${progressMessage} He actualizado "${task.title}" al ${params.progress}%.

${params.progress === 100
  ? "🏆 ¿Qué sigue? ¿Hay otra tarea en la que te gustaría concentrarte?"
  : "💡 ¿Necesitas que ajuste algo más o quieres continuar con otra tarea?"}`
      };
    } catch (error) {
      return { success: false, message: "Error al actualizar el progreso: " + error.message };
    }
  };

  const addTaskToDailyFocusFromAssistant = (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      const task = project.tasks.find(t => t.title.toLowerCase().includes(params.task_title.toLowerCase()));
      if (!task) {
        return { success: false, message: `No se encontró la tarea "${params.task_title}" en el proyecto "${project.title}".` };
      }

      // Verificar si ya está en el enfoque diario
      const alreadyInDaily = dailyTasks.some(dt =>
        dt.projectId === project.id && dt.projectTaskId === task.id
      );

      if (alreadyInDaily) {
        return {
          success: false,
          message: `La tarea "${task.title}" ya está en tu enfoque de hoy. ¡Perfecto! Ya la tienes priorizada para trabajar en ella.`
        };
      }

      addProjectTaskToDaily(project.id, task);

      return {
        success: true,
        message: `🎯 ¡Excelente decisión! He agregado "${task.title}" a tu enfoque de hoy.

Ahora ya tienes una tarea concreta para avanzar en tu proyecto "${project.title}". Ve al Dashboard o a la pestaña principal y ¡comienza a ejecutar! 💪

¿Hay alguna otra tarea que quieras priorizar para hoy?`
      };
    } catch (error) {
      return { success: false, message: "Error al agregar al enfoque diario: " + error.message };
    }
  };

  const getProjectsStatusFromAssistant = () => {
    try {
      if (projects.length === 0) {
        return {
          success: true,
          message: `📋 Actualmente no tienes proyectos creados.

¡Pero eso es perfecto para empezar! ¿Qué te parece si creamos tu primer proyecto? Solo dime:
- El nombre del proyecto
- La prioridad (alta, media o baja)
- Si tiene fecha límite

Por ejemplo: "Crea un proyecto llamado 'Lanzar mi negocio online' con prioridad alta para el 31 de diciembre"`
        };
      }

      const activeProjects = projects.filter(p => p.status === 'activo');
      const completedProjects = projects.filter(p => p.status === 'completado');
      const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
      const completedTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);

      let statusMessage = `📊 **Estado de tus proyectos:**

🚀 **Proyectos activos:** ${activeProjects.length}
✅ **Proyectos completados:** ${completedProjects.length}
📝 **Total de tareas:** ${totalTasks}
🎯 **Tareas completadas:** ${completedTasks}/${totalTasks}

`;

      if (activeProjects.length > 0) {
        statusMessage += "**Detalles de proyectos activos:**\n";
        activeProjects.forEach(project => {
          const taskStatus = project.tasks.length > 0
            ? `${project.tasks.filter(t => t.completed).length}/${project.tasks.length} tareas`
            : "Sin tareas aún";

          statusMessage += `\n🔸 **${project.title}** (${project.priority} prioridad)
   Progreso: ${project.progress}% | Tareas: ${taskStatus}`;

          if (project.deadline) {
            statusMessage += ` | ⏰ Fecha límite: ${project.deadline}`;
          }
        });

        statusMessage += `\n\n💡 **Recomendación:** ${
          totalTasks === 0
            ? "¡Agreguemos tareas a tus proyectos para comenzar a avanzar!"
            : completedTasks / totalTasks < 0.3
            ? "Enfócate en completar las tareas existentes antes de agregar más."
            : "¡Vas muy bien! ¿Te ayudo a agregar más tareas o quieres enfocar alguna para hoy?"
        }`;
      }

      return {
        success: true,
        message: statusMessage
      };
    } catch (error) {
      return { success: false, message: "Error al obtener información de proyectos: " + error.message };
    }
  };

  // Función para construir el prompt del sistema basado en la configuración
  const buildSystemPrompt = () => {
    const userName = assistantConfig.userName || "Usuario";
    const assistantName = assistantConfig.assistantName;
    const specialtiesText = assistantConfig.specialties.length > 0
      ? `especializado en ${assistantConfig.specialties.join(', ')}`
      : "con experiencia multidisciplinaria";

    let toneInstructions = "";
    switch (assistantConfig.tone) {
      case 'Motivador':
        toneInstructions = "Siempre sé positivo, energético y motivacional. Impulsa al usuario a tomar acción.";
        break;
      case 'Formal':
        toneInstructions = "Mantén un tono profesional, estructurado y respetuoso en todas las respuestas.";
        break;
      case 'Amigable':
        toneInstructions = "Sé cercano, empático y conversacional, como un amigo experto que ayuda.";
        break;
      case 'Crítico':
        toneInstructions = "Sé directo, analítico y desafiante. Cuestiona ideas para mejorar los resultados.";
        break;
    }

    const focusAreasText = Object.entries(assistantConfig.focusAreas)
      .filter(([_, isActive]) => isActive)
      .map(([area, _]) => area)
      .join(', ');

    // Obtener la fecha actual del navegador
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeString = currentDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Función para construir el contexto de memoria
    const buildMemoryContext = () => {
      const memory = assistantConfig.memory;
      let memoryText = "";

      if (memory.personalityTraits) {
        memoryText += `\n• PERSONALIDAD: ${memory.personalityTraits}`;
      }
      if (memory.motivationalTriggers) {
        memoryText += `\n• QUÉ LO MOTIVA: ${memory.motivationalTriggers}`;
      }
      if (memory.challengesAndStruggles) {
        memoryText += `\n• DESAFÍOS Y LUCHAS: ${memory.challengesAndStruggles}`;
      }
      if (memory.achievements) {
        memoryText += `\n• LOGROS Y FORTALEZAS: ${memory.achievements}`;
      }
      if (memory.learningStyle) {
        memoryText += `\n• ESTILO DE APRENDIZAJE: ${memory.learningStyle}`;
      }
      if (memory.workPatterns) {
        memoryText += `\n• PATRONES DE TRABAJO: ${memory.workPatterns}`;
      }
      if (memory.emotionalContext) {
        memoryText += `\n• CONTEXTO EMOCIONAL: ${memory.emotionalContext}`;
      }
      if (memory.growthAreas) {
        memoryText += `\n• ÁREAS DE CRECIMIENTO: ${memory.growthAreas}`;
      }
      if (memory.currentPriorities) {
        memoryText += `\n• PRIORIDADES ACTUALES: ${memory.currentPriorities}`;
      }

      return memoryText || "Aún no hay información de memoria a largo plazo registrada. Aprenderé sobre ti a medida que conversemos.";
    };

    return `${assistantConfig.basePrompt}

INFORMACIÓN PERSONAL:
- Mi nombre es ${assistantName}
- Estoy hablando con ${userName}
- Soy ${specialtiesText}

FECHA Y HORA ACTUAL:
- Hoy es ${dateString}
- Son las ${timeString}
- Usa esta información para referencias de tiempo relativas (ej: "en una semana", "mañana", "la próxima semana", etc.)

TONO Y ESTILO:
${toneInstructions}

ÁREAS DE ENFOQUE ACTIVAS:
${focusAreasText}

FUNCIONES DISPONIBLES:
Tengo acceso a funciones especiales para ayudarte a gestionar tus proyectos y tareas:

1. create_project - Puedo crear proyectos nuevos con título, descripción, prioridad (baja/media/alta) y fecha límite
2. add_project_task - Puedo agregar tareas a proyectos existentes
3. update_task_progress - Puedo actualizar el progreso de tareas específicas (0-100%)
4. add_task_to_daily_focus - Puedo agregar tareas de proyectos al enfoque diario
5. get_projects_status - Puedo consultar el estado actual de todos los proyectos

INSTRUCCIONES PARA USO DE FUNCIONES:
- Cuando el usuario mencione crear, agregar o gestionar proyectos/tareas, usa las funciones apropiadas
- Siempre confirma las acciones realizadas y explica qué se hizo
- Si el usuario pide información sobre proyectos, usa get_projects_status primero
- Sé proactivo sugiriendo acciones útiles como agregar tareas al enfoque diario

MEMORIA A LARGO PLAZO Y CONTEXTO EMOCIONAL:
${buildMemoryContext()}

INSTRUCCIONES ADICIONALES:
- Usa el nombre ${userName} de manera natural en la conversación
- Identifícate como ${assistantName} cuando sea relevante
- Aplica tu experiencia en ${assistantConfig.specialties.join(', ')} para dar consejos específicos
- Mantén las respuestas prácticas y orientadas a la acción
- Cuando uses funciones, explica claramente qué hiciste y ofrece próximos pasos
- IMPORTANTE: Usa la memoria a largo plazo para personalizar completamente tus respuestas y sugerencias
- Adapta tu motivación basándote en el contexto emocional y patrones de trabajo del usuario
- Sugiere estrategias de crecimiento evolutivo basadas en las áreas de mejora identificadas
- PRIORIDAD MÁXIMA: Enfócate principalmente en las prioridades actuales del usuario
- APRENDIZAJE AUTOMÁTICO: Observa y aprende constantemente sobre el usuario a partir de sus mensajes, decisiones y patrones
- Identifica automáticamente: patrones de trabajo, preferencias, desafíos, fortalezas y estilo de comunicación

Responde siempre en español y mantén el tono configurado.`;
  };

  // Función para formatear el historial de conversación para OpenAI
  const formatConversationHistory = () => {
    return messages
      .filter(msg => msg.type !== 'system') // Excluir mensajes del sistema si los hay
      .slice(-10) // Mantener solo los últimos 10 mensajes para eficiencia
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  };

  const saveConfiguration = async () => {
    try {
      // TODO: Aquí harías la llamada a tu backend para persistir la configuración
      /*
      const response = await fetch('/api/assistant/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          userId: currentUserId,
          basePrompt: assistantConfig.basePrompt,
          userName: assistantConfig.userName,
          assistantName: assistantConfig.assistantName,
          specialties: assistantConfig.specialties,
          tone: assistantConfig.tone,
          focusAreas: assistantConfig.focusAreas
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      const result = await response.json();
      console.log('Configuración guardada:', result);
      */

      setIsConfigSaved(true);
      setTimeout(() => setIsConfigSaved(false), 3000);

    } catch (error) {
      console.error('Error guardando configuración:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isAssistantTyping) return;

    // Detener reconocimiento de voz si está activo
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      // Limpiar el texto acumulado para evitar que se restaure
      finalTranscriptRef.current = '';
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');
    setIsAssistantTyping(true);

    try {
      // Llamada a OpenAI API con autenticación
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt()
            },
            ...formatConversationHistory(),
            {
              role: 'user',
              content: currentMessage
            }
          ],
          functions: assistantFunctions,
          function_call: "auto",
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Error de OpenAI: ${response.status}`);
      }

      const result = await response.json();
      const message = result.choices[0].message;

      let assistantResponse = message.content;
      let functionResults = [];

      // Verificar si hay function calls
      if (message.function_call) {
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments);

        // Ejecutar la función
        const functionResult = executeAssistantFunction(functionName, functionArgs);
        functionResults.push(functionResult);

        // Si la función fue exitosa, agregar información adicional a la respuesta
        if (functionResult.success) {
          assistantResponse = assistantResponse
            ? `${assistantResponse}\n\n✅ ${functionResult.message}`
            : `✅ ${functionResult.message}`;
        } else {
          assistantResponse = assistantResponse
            ? `${assistantResponse}\n\n❌ ${functionResult.message}`
            : `❌ ${functionResult.message}`;
        }
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantResponse || "He procesado tu solicitud.",
        timestamp: new Date().toLocaleTimeString(),
        functionResults: functionResults
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Síntesis de voz para la respuesta del asistente
      if (voiceEnabled && assistantResponse) {
        // Limpiar el texto de markdown para síntesis de voz
        const cleanText = assistantResponse
          .replace(/\*\*(.*?)\*\*/g, '$1') // Quitar bold
          .replace(/\*(.*?)\*/g, '$1') // Quitar cursiva
          .replace(/#{1,6}\s/g, '') // Quitar encabezados
          .replace(/```[\s\S]*?```/g, '[código]') // Reemplazar bloques de código
          .replace(/`([^`]+)`/g, '$1') // Quitar comillas inversas
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Limpiar enlaces
          .replace(/[📊🚀✅📝🎯💡🔸⏰📋]/g, '') // Quitar emojis comunes
          .trim();

        if (cleanText) {
          speakText(cleanText);
        }
      }

    } catch (error) {
      console.error('Error enviando mensaje:', error);

      // Mensaje de error para el usuario
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, verifica tu conexión a internet o intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleTask = (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task) {
      // Actualizar tarea diaria
      setDailyTasks(dailyTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));

      // Sincronizar con tarea de proyecto si está vinculada
      if (task.projectId && task.projectTaskId) {
        setProjects(projects.map(project => {
          if (project.id === task.projectId) {
            const updatedTasks = project.tasks.map(pt =>
              pt.id === task.projectTaskId ? { ...pt, completed: !task.completed } : pt
            );
            return { ...project, tasks: updatedTasks };
          }
          return project;
        }));
        updateProjectProgressFromTasks(task.projectId);
      }
    }
  };

  const deleteTask = (taskId) => {
    setDailyTasks(dailyTasks.filter(task => task.id !== taskId));
  };

  const startEditingTask = (taskId, taskText) => {
    setEditingTaskId(taskId);
    setEditingTaskText(taskText);
  };

  const saveEditedTask = () => {
    if (editingTaskText.trim()) {
      setDailyTasks(dailyTasks.map(task =>
        task.id === editingTaskId ? { ...task, text: editingTaskText.trim() } : task
      ));
    }
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  const getProjectsByStatus = (status) => projects.filter(p => p.status === status);
  const activeProjects = getProjectsByStatus('activo');
  const completedTasks = dailyTasks.filter(t => t.completed).length;
  const completionRate = dailyTasks.length > 0 ? Math.round((completedTasks / dailyTasks.length) * 100) : 0;

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'alta': return 'text-red-600 bg-red-50';
      case 'media': return 'text-yellow-600 bg-yellow-50';
      case 'baja': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProjectColor = (projectId) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-orange-100 text-orange-800'
    ];

    // Ensure we have a valid projectId and generate a safe index
    if (!projectId && projectId !== 0) {
      return colors[0]; // Default color
    }

    // Convert to string and get a hash-like number for consistent colors
    const id = typeof projectId === 'string' ? projectId : String(projectId);
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = hash * 31 + id.charCodeAt(i);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const getProjectById = (projectId) => {
    return projects.find(p => p.id === projectId);
  };

  const renderDashboard = () => (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      {/* Coach Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg flex-shrink-0">
        <h2 className="text-lg font-bold mb-1">Tu Coach Personal te dice:</h2>
        <p className="text-sm">{coachMessage}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        <div
          className="bg-blue-50 p-2 md:p-3 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setShowActiveProjectsModal(true)}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-blue-600 font-semibold text-xs md:text-sm">Proyectos</p>
              <p className="text-lg md:text-xl font-bold text-blue-800">{activeProjects.length}</p>
            </div>
            <Target className="text-blue-500 hidden md:block" size={20} />
          </div>
        </div>

        <div className="bg-green-50 p-2 md:p-3 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-green-600 font-semibold text-xs md:text-sm">Tareas</p>
              <p className="text-lg md:text-xl font-bold text-green-800">{completedTasks}/{dailyTasks.length}</p>
            </div>
            <CheckCircle className="text-green-500 hidden md:block" size={20} />
          </div>
        </div>

        <div className="bg-purple-50 p-2 md:p-3 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-purple-600 font-semibold text-xs md:text-sm">Efectividad</p>
              <p className="text-lg md:text-xl font-bold text-purple-800">{completionRate}%</p>
            </div>
            <TrendingUp className="text-purple-500 hidden md:block" size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left Column - Today's Focus */}
        <div className="flex-1 bg-white border rounded-lg p-4 flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold mb-3 flex items-center flex-shrink-0">
            <Calendar className="mr-2 text-blue-500" size={18} />
            Enfoque de Hoy
          </h3>


          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="space-y-2 flex-1 overflow-y-auto">
            {dailyTasks.map(task => {
            const project = task.projectId ? getProjectById(task.projectId) : null;
            return (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editingTaskText}
                        onChange={(e) => setEditingTaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditedTask();
                          if (e.key === 'Escape') cancelEditingTask();
                        }}
                        onBlur={saveEditedTask}
                        className="w-full p-1 border rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                          {task.text}
                        </span>
                        {project && (
                          <div className="mt-1">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getProjectColor(project.id)}`}>
                              {project.title}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {editingTaskId === task.id ? (
                    <>
                      <button
                        onClick={saveEditedTask}
                        className="text-green-500 hover:text-green-700 hover:bg-green-50 p-1 rounded"
                        title="Guardar"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={cancelEditingTask}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-1 rounded"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditingTask(task.id, task.text)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded"
                        title="Editar tarea"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                        title="Eliminar tarea"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
            </div>

            {/* Add Task Button - Minimalist - At Bottom like Trello */}
            <div className="mt-3 flex-shrink-0">
              {!showAddTaskForm ? (
                <button
                  onClick={() => setShowAddTaskForm(true)}
                  className="w-full bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  <Plus size={16} className="mr-2" />
                  Añadir tarea
                </button>
              ) : (
                <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {/* Selector de proyecto */}
                  <select
                    value={selectedProjectForTask}
                    onChange={(e) => {
                      const projectId = e.target.value;
                      setSelectedProjectForTask(projectId);
                      if (projectId) {
                        const project = projects.find(p => p.id === projectId);

                        // Filtrar tareas que NO están completadas Y NO están en el enfoque diario
                        const availableTasks = project?.tasks?.filter(task => {
                          // 1. Verificar que la tarea no esté completada
                          const isNotCompleted = !task.completed && task.completed !== "true" && task.completed !== 1;
                          const progressLessThan100 = (task.progress || 0) < 100;
                          const taskIncomplete = isNotCompleted || progressLessThan100;

                          // 2. Verificar que la tarea NO esté en el enfoque diario
                          const notInDailyFocus = !dailyTasks.some(dt =>
                            dt.projectId === project.id && dt.projectTaskId === task.id
                          );

                          // Solo mostrar si está incompleta Y no está en el enfoque diario
                          return taskIncomplete && notInDailyFocus;
                        }) || [];
                        setSelectedProjectTasks(availableTasks);
                      } else {
                        setSelectedProjectTasks([]);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Crear nueva tarea personal</option>
                    {projects.filter(p => p.status === 'activo').map(project => (
                      <option key={project.id} value={project.id}>
                        📋 {project.title}
                      </option>
                    ))}
                  </select>

                  {/* Tareas disponibles del proyecto */}
                  {selectedProjectForTask && selectedProjectTasks.length > 0 && (
                    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">
                        Tareas disponibles del proyecto:
                      </h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {selectedProjectTasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                            <span className="flex-1 truncate text-gray-700">📋 {task.title}</span>
                            <button
                              onClick={() => {
                                addProjectTaskToDaily(selectedProjectForTask, task);
                                setShowAddTaskForm(false);
                                setSelectedProjectForTask('');
                                setSelectedProjectTasks([]);
                              }}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                            >
                              + Agregar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input para nueva tarea */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDailyTask}
                      onChange={(e) => setNewDailyTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addDailyTask();
                          setShowAddTaskForm(false);
                          setSelectedProjectForTask('');
                          setSelectedProjectTasks([]);
                        }
                      }}
                      placeholder={selectedProjectForTask ? "Nombre de la nueva tarea del proyecto..." : "Nombre de la nueva tarea personal..."}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        addDailyTask();
                        setShowAddTaskForm(false);
                        setSelectedProjectForTask('');
                        setSelectedProjectTasks([]);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm"
                    >
                      Crear
                    </button>
                    <button
                      onClick={() => {
                        setShowAddTaskForm(false);
                        setSelectedProjectForTask('');
                        setSelectedProjectTasks([]);
                        setNewDailyTask('');
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal de Proyectos Activos */}
      {showActiveProjectsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Proyectos Activos</h3>
                  <p className="text-blue-100 text-sm">Gestiona y revisa el progreso de tus proyectos</p>
                </div>
                <button
                  onClick={() => setShowActiveProjectsModal(false)}
                  className="text-white hover:text-blue-200 transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">

            <div className="space-y-4">
              {activeProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tienes proyectos activos en este momento</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeProjects.map(project => (
                    <div
                      key={project.id}
                      className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                      onClick={() => openProjectDetail(project)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-xl font-bold text-gray-900 flex-1">{project.title}</h4>
                        <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(project.priority)}`}>
                          {project.priority.toUpperCase()}
                        </span>
                      </div>

                      {project.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <CheckCircle size={16} className="mr-2 text-blue-500" />
                            {project.tasks?.length || 0} tareas
                          </span>
                          <span className="font-semibold text-blue-600">
                            {project.progress || 0}% completado
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>

                        {project.deadline && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar size={16} className="mr-2" />
                            Fecha límite: {project.deadline}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400 italic">Click para ver detalles</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {activeProjects.length} proyecto{activeProjects.length !== 1 ? 's' : ''} activo{activeProjects.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    setShowActiveProjectsModal(false);
                    setActiveView('projects');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
                >
                  <Target size={16} className="mr-2" />
                  Ver todos los proyectos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // TODO: Add renderProjectsView function back after fixing main structure

  const renderProjectsView = () => {
    return (
      <div className="h-full flex flex-col space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Proyectos</h1>
            <p className="text-gray-600 mt-1">Gestiona y organiza todos tus proyectos</p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="space-y-8">
              {/* Mensaje cuando no hay proyectos */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Proyectos Activos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card para Nuevo Proyecto */}
                  <div
                    onClick={() => setShowCreateProject(true)}
                    className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 flex flex-col items-center justify-center min-h-[200px] group"
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Plus size={24} className="text-blue-600" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">Crear tu primer proyecto</h3>
                        <p className="text-sm text-gray-500">Haz click para comenzar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Proyectos Activos */}
              {(() => {
                const activeProjects = projects.filter(p => p.status === 'activo');
                const inactiveProjects = projects.filter(p => p.status !== 'activo');

                return (
                  <>
                    {/* Sección de Proyectos Activos */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Proyectos Activos</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeProjects.map(project => (
                          <div
                            key={project.id}
                            onClick={() => {
                              setSelectedProject(project);
                              setShowProjectDetailModal(true);
                            }}
                            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300 hover:bg-blue-50/30"
                          >
                            {/* Project Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {project.title}
                                </h3>
                                <div className="flex items-center space-x-3 text-sm">
                                  {/* Estado */}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                    project.status === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                      project.status === 'activo' ? 'bg-green-500' : 'bg-gray-400'
                                    }`}></span>
                                    {project.status === 'activo' ? 'Activo' : 'Inactivo'}
                                  </span>

                                  {/* Prioridad */}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    project.priority === 'alta' ? 'bg-red-100 text-red-800' :
                                    project.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {project.priority === 'alta' ? '🔴 Alta' :
                                     project.priority === 'media' ? '🟡 Media' : '🟢 Baja'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Project Description */}
                            {project.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                {project.description}
                              </p>
                            )}

                            {/* Project Stats */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Tareas:</span>
                                <span className="font-medium">
                                  {project.tasks?.filter(t => t.completed).length || 0} / {project.tasks?.length || 0}
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: (project.progress || 0) >= 100 ? '#10b981' : '#3b82f6',
                                    width: `${project.progress || 0}%`,
                                  }}
                                ></div>
                              </div>

                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Progreso:</span>
                                <span className="font-medium">{project.progress || 0}%</span>
                              </div>

                              {/* Deadline */}
                              {project.deadline && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-500">Fecha límite:</span>
                                  <span className="font-medium text-orange-600">
                                    {new Date(project.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Card para Nuevo Proyecto */}
                        <div
                          onClick={() => setShowCreateProject(true)}
                          className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 flex flex-col items-center justify-center min-h-[200px] group"
                        >
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <Plus size={24} className="text-blue-600" />
                            </div>
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-gray-700 mb-1">Nuevo Proyecto</h3>
                              <p className="text-sm text-gray-500">Haz click para crear un proyecto</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección de Proyectos Inactivos */}
                    {inactiveProjects.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Proyectos Inactivos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {inactiveProjects.map(project => (
                            <div
                              key={project.id}
                              onClick={() => {
                                setSelectedProject(project);
                                setShowProjectDetailModal(true);
                              }}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-gray-400 opacity-75 hover:opacity-100"
                            >
                              {/* Project Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-700 mb-2 line-clamp-2">
                                    {project.title}
                                  </h3>
                                  <div className="flex items-center space-x-3 text-sm">
                                    {/* Estado */}
                                    <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-gray-100 text-gray-600">
                                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                      Inactivo
                                    </span>

                                    {/* Prioridad */}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      project.priority === 'alta' ? 'bg-red-100 text-red-800' :
                                      project.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {project.priority === 'alta' ? '🔴 Alta' :
                                       project.priority === 'media' ? '🟡 Media' : '🟢 Baja'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Project Description */}
                              {project.description && (
                                <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                                  {project.description}
                                </p>
                              )}

                              {/* Project Stats */}
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-500">Tareas:</span>
                                  <span className="font-medium text-gray-600">
                                    {project.tasks?.filter(t => t.completed).length || 0} / {project.tasks?.length || 0}
                                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-300 bg-gray-400"
                                    style={{
                                      width: `${project.progress || 0}%`,
                                    }}
                                  ></div>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-500">Progreso:</span>
                                  <span className="font-medium text-gray-600">{project.progress || 0}%</span>
                                </div>

                                {/* Deadline */}
                                {project.deadline && (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Fecha límite:</span>
                                    <span className="font-medium text-gray-600">
                                      {new Date(project.deadline).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Funciones para los modales
  const saveAssistantConfig = async () => {
    try {
      const response = await authenticatedFetch('/assistant-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: assistantConfig }),
      });

      if (response.ok) {
        setIsConfigSaved(true);
        setTimeout(() => setIsConfigSaved(false), 2000);
      } else {
        throw new Error('Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración');
    }
  };

  const saveUserConfig = async () => {
    try {
      // Validar contraseñas si se están cambiando
      if (userConfig.newPassword) {
        if (userConfig.newPassword.length < 6) {
          alert('La nueva contraseña debe tener al menos 6 caracteres');
          return;
        }
        if (userConfig.newPassword !== userConfig.confirmPassword) {
          alert('Las contraseñas no coinciden');
          return;
        }

        // Implementar cambio de contraseña
        const response = await authenticatedFetch(`${getApiBase()}/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newPassword: userConfig.newPassword
          }),
        });

        if (!response.ok) {
          throw new Error('Error al cambiar contraseña');
        }
      }

      // Guardar configuración del asistente (que incluye la memoria)
      await saveAssistantConfig();

      // Limpiar campos de contraseña después de guardar
      setUserConfig(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));

      setShowUserProfileModal(false);
      setShowPasswordFields(false);

      alert('Configuración guardada exitosamente' + (userConfig.newPassword ? ' y contraseña actualizada' : ''));
    } catch (error) {
      console.error('Error guardando configuración de usuario:', error);
      alert('Error al guardar: ' + error.message);
    }
  };

  // Efecto para actualizar userConfig cuando el usuario se carga
  useEffect(() => {
    if (user) {
      setUserConfig(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Efecto para persistir el theme
  useEffect(() => {
    localStorage.setItem('smartchatix-theme', currentTheme);
  }, [currentTheme]);

  // Efecto para cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  const renderAssistantView = () => {
    return (
      <div className="h-full flex flex-col overflow-hidden relative">
        {/* Header con botón de configuración */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center">
              <Bot className="mr-2" size={20} />
              Chat con {assistantConfig.assistantName}
            </h2>
            <p className="text-purple-100 text-sm">
              {assistantConfig.userName ? `Hola ${assistantConfig.userName}!` : 'Conversa con tu asistente personal'}
            </p>
          </div>
          <button
            onClick={() => setShowAssistantModal(true)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Configurar asistente"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Container principal */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Panel de Configuración Izquierdo */}
          {showConfigPanel && (
            <div className="w-80 mr-4 bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden flex flex-col">
              {/* Header del menú */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Configuración</h3>
                  <button
                    onClick={() => {
                      setShowConfigPanel(false);
                      setSelectedConfigSection('');
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Cerrar menú"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Opciones del menú */}
              <div className="flex-1 p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedConfigSection('user')}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConfigSection === 'user'
                        ? 'bg-gray-700 text-white'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <User size={18} className="mr-3" />
                      <div>
                        <div className="font-medium">Usuario</div>
                        <div className="text-xs text-gray-400">Nombre, memoria personal</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedConfigSection('assistant')}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConfigSection === 'assistant'
                        ? 'bg-gray-700 text-white'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Bot size={18} className="mr-3" />
                      <div>
                        <div className="font-medium">Asistente</div>
                        <div className="text-xs text-gray-400">Personalidad, prompt, especialidades</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Panel de Contenido de Configuración y Chat */}
          <>
            {showConfigPanel && selectedConfigSection && (
              <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                {/* Header del panel de contenido */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center">
                    <Settings className="mr-2" size={18} />
                    {selectedConfigSection === 'user' ? 'Configuración de Usuario' : 'Configuración del Asistente'}
                  </h3>
                  <button
                    onClick={() => setSelectedConfigSection('')}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                    title="Cerrar panel"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Contenido del panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConfigSection === 'user' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      👤 Datos del Usuario
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tu nombre
                        </label>
                        <input
                          type="text"
                          value={assistantConfig.userName}
                          onChange={(e) => handleConfigChange('userName', e.target.value)}
                          placeholder="¿Cómo te gustaría que te llame?"
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedConfigSection === 'assistant' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      🤖 Asistente
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nombre del asistente
                        </label>
                        <input
                          type="text"
                          value={assistantConfig.assistantName}
                          onChange={(e) => handleConfigChange('assistantName', e.target.value)}
                          placeholder="Nombre de tu asistente"
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Especialidades */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          🎓 Especialidades
                        </label>
                        {assistantConfig.specialties.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {assistantConfig.specialties.map((specialty) => (
                              <span
                                key={specialty}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
                              >
                                {specialty}
                                <button
                                  onClick={() => removeSpecialty(specialty)}
                                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                                  title="Eliminar"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="relative">
                          <style jsx>{`
                            .custom-scrollbar::-webkit-scrollbar {
                              width: 8px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                              background: #f3f4f6;
                              border-radius: 4px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                              background: #6366f1;
                              border-radius: 4px;
                              border: 1px solid #e5e7eb;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                              background: #4f46e5;
                            }
                            .custom-scrollbar {
                              scrollbar-width: thin;
                              scrollbar-color: #6366f1 #f3f4f6;
                            }
                          `}</style>
                          <div
                            className="custom-scrollbar space-y-1 max-h-24 overflow-y-auto text-xs pr-1 border border-gray-200 rounded-md px-2 py-1 bg-white"
                          >
                            {availableSpecialties.map((specialty) => (
                              <label
                                key={specialty}
                                className="flex items-center hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={assistantConfig.specialties.includes(specialty)}
                                  onChange={() => {
                                    if (assistantConfig.specialties.includes(specialty)) {
                                      removeSpecialty(specialty);
                                    } else {
                                      handleConfigChange('specialties', [...assistantConfig.specialties, specialty]);
                                    }
                                  }}
                                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-700">{specialty}</span>
                              </label>
                            ))}
                          </div>
                          {/* Indicador de fade-out para mostrar que hay más contenido */}
                          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none rounded-b-md"></div>
                        </div>

                        {/* Campo para agregar especialidad personalizada */}
                        <div className="mt-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCustomSpecialty}
                              onChange={(e) => setNewCustomSpecialty(e.target.value)}
                              placeholder="Escribe una especialidad personalizada"
                              className="flex-1 p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addCustomSpecialty();
                                }
                              }}
                            />
                            <button
                              onClick={addCustomSpecialty}
                              disabled={!newCustomSpecialty.trim()}
                              className="px-3 py-2 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Agregar especialidad"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Prompt Inicial */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          📝 Prompt Inicial del Asistente
                        </label>
                        <textarea
                          value={assistantConfig.systemPrompt}
                          onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                          placeholder="Define la personalidad y comportamiento de tu asistente..."
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-vertical"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Este prompt define cómo se comportará tu asistente en las conversaciones.
                        </p>
                      </div>

                      {/* Tono */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          🎯 Tono
                        </label>
                        <select
                          value={assistantConfig.tone}
                          onChange={(e) => handleConfigChange('tone', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Motivador">Motivador</option>
                          <option value="Profesional">Profesional</option>
                          <option value="Amigable">Amigable</option>
                          <option value="Directo">Directo</option>
                        </select>
                      </div>

                      {/* Memoria a Largo Plazo */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          🧠 Memoria a Largo Plazo
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Estos campos se van llenando automáticamente durante las interacciones, pero puedes completarlos para que te conozca más rápido.
                        </p>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Rasgos de personalidad</label>
                            <textarea
                              value={assistantConfig.memory.personalityTraits}
                              onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, personalityTraits: e.target.value})}
                              placeholder="Ej: Soy una persona analítica y organizada..."
                              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Motivadores personales</label>
                            <textarea
                              value={assistantConfig.memory.motivationalTriggers}
                              onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, motivationalTriggers: e.target.value})}
                              placeholder="Ej: Me motivan los desafíos, reconocimiento..."
                              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Estilo de aprendizaje</label>
                            <textarea
                              value={assistantConfig.memory.learningStyle}
                              onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, learningStyle: e.target.value})}
                              placeholder="Ej: Aprendo mejor con ejemplos prácticos..."
                              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Prioridades actuales</label>
                            <textarea
                              value={assistantConfig.memory.currentPriorities}
                              onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, currentPriorities: e.target.value})}
                              placeholder="Ej: Enfocarme en proyectos de desarrollo web..."
                              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón Guardar */}
                <button
                  onClick={saveConfiguration}
                  className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center justify-center"
                >
                  <Save size={14} className="mr-1" />
                  {isConfigSaved && <CheckCircle2 size={14} className="mr-1" />}
                  {isConfigSaved ? 'Guardado!' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          )}

          {/* Chat Principal - Se oculta cuando hay configuración seleccionada */}
          {!(showConfigPanel && selectedConfigSection) && (
            <div className={`transition-all duration-300 ${showConfigPanel ? 'flex-1' : 'w-full'} flex flex-col overflow-hidden bg-white rounded-lg shadow-lg`}>
              {/* Mensajes del chat */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className="w-full"
                  >
                    <div
                    className={`w-full px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-indigo-50 border-l-4 border-indigo-500'
                        : 'bg-gray-50 border-l-4 border-gray-400'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'assistant' && (
                        <Bot size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                      )}
                      {message.type === 'user' && (
                        <User size={16} className="text-indigo-200 mt-1 flex-shrink-0" />
                      )}
                      <div>
                        {message.type === 'assistant' ? (
                          <div className="text-sm leading-relaxed">
                            <ReactMarkdown
                              components={{
                                p: ({children}) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                                ul: ({children}) => <ul className="mb-2 pl-4 space-y-1 list-disc">{children}</ul>,
                                ol: ({children}) => <ol className="mb-2 pl-4 space-y-1 list-decimal">{children}</ol>,
                                li: ({children}) => <li className="text-sm text-gray-800">{children}</li>,
                                h1: ({children}) => <h1 className="text-base font-bold mb-2 text-gray-900">{children}</h1>,
                                h2: ({children}) => <h2 className="text-sm font-bold mb-1 text-gray-900">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-semibold mb-1 text-gray-900">{children}</h3>,
                                strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                em: ({children}) => <em className="italic">{children}</em>,
                                code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-3 mb-2 italic text-gray-700">{children}</blockquote>,
                                br: () => <br className="mb-1" />
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>
                ))}

                {/* Indicador de que el asistente está escribiendo */}
                {isAssistantTyping && (
                  <div className="w-full">
                    <div className="w-full px-4 py-3 bg-gray-50 border-l-4 border-gray-400">
                      <div className="flex items-start space-x-2">
                        <Bot size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{assistantConfig.assistantName} está escribiendo</span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>

              {/* Input para nuevo mensaje */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
                {/* Controles de voz */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex space-x-2">
                    {speechSupported ? (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isAssistantTyping}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                          isListening
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
                      >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        <span className="ml-1">{isListening ? 'Grabando (2s de pausa para terminar)' : 'Hablar'}</span>
                      </button>
                    ) : (
                      <div className="px-3 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-medium">
                        <MicOff size={16} className="inline mr-1" />
                        Voz no disponible
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                        voiceEnabled
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-400 text-white hover:bg-gray-500'
                      }`}
                      title={voiceEnabled ? 'Desactivar voz del asistente' : 'Activar voz del asistente'}
                    >
                      {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    {isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                        title="Detener síntesis de voz"
                      >
                        <VolumeX size={16} />
                        <span className="ml-1">Silenciar</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? 'Escuchando... (Haz una pausa de 2 segundos para terminar)' : `Escribe tu mensaje a ${assistantConfig.assistantName}...`}
                    className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-colors ${
                      isListening
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    disabled={isAssistantTyping}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isAssistantTyping}
                    className="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Enviar mensaje"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
          </>

        </div>
      </div>
    );
  };

  // Main component JSX
  // Mostrar pantalla de carga mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  const themeStyles = getThemeStyles(currentTheme);
  const headerStyles = getHeaderStyles(currentTheme);

  return (
    <div className={`min-h-screen flex flex-col ${themeStyles.className}`} style={{
      background: themeStyles.background,
      backgroundSize: themeStyles.backgroundSize,
      animation: themeStyles.animation,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className={`flex-shrink-0 px-6 py-4 ${headerStyles.className || ''}`} style={{
        background: headerStyles.background,
        backdropFilter: headerStyles.backdropFilter,
        border: headerStyles.border,
        borderBottom: headerStyles.borderBottom,
        boxShadow: headerStyles.boxShadow,
        color: headerStyles.color,
        position: 'relative'
      }}>
        <div className="flex items-center justify-between">
          {/* Logo y Nombre juntos */}
          <div className="flex items-center space-x-3">
            {/* Logo de SmartChatix */}
            <div className="relative flex items-center justify-center">
            <div className={`${currentTheme === 'brutalist' ? 'w-10 h-10 md:w-14 md:h-14' : 'w-14 h-14'} flex items-center justify-center ${currentTheme === 'brutalist' ? 'p-1 md:p-2' : 'p-2'} mr-4 ${
              currentTheme === 'retro' ? 'cyber-logo' :
              currentTheme === 'minimal' ? 'bg-white/50 rounded-xl backdrop-blur-sm soft-shadow' :
              currentTheme === 'brutalist' ? 'brutalist-card bg-white' :
              'bg-white/50 rounded-xl backdrop-blur-sm'
            }`} style={{
              animation: currentTheme === 'retro' ? 'retroWave 6s ease-in-out infinite' :
                        currentTheme === 'minimal' ? 'floatSoft 4s ease-in-out infinite' :
                        currentTheme === 'brutalist' ? 'glitchEffect 7s infinite reverse' :
                        'floatSoft 4s ease-in-out infinite'
            }}>
              {/* Logo SmartChatix - Oficial */}
              <img
                src="/smartchatix_logo.svg"
                alt="SmartChatix Logo"
                width="44"
                height="24"
                className="drop-shadow-lg"
              />
            </div>
          </div>

          {/* Nombre y slogan */}
          <div className="flex flex-col">
            <h1 className={`text-2xl md:text-3xl font-bold ${currentTheme === 'brutalist' ? 'terminal-font' : currentTheme === 'minimal' ? 'system-font' : 'retro-font'}`} style={headerStyles.titleStyle}>
              {currentTheme === 'brutalist' ? '> SMARTCHATIX_' : 'SMARTCHATIX'}
            </h1>
            <p className={`text-sm font-light -mt-1 ${currentTheme === 'brutalist' ? 'terminal-font' : 'synthwave-font'}`} style={headerStyles.subtitleStyle}>
              {currentTheme === 'brutalist' ? '[SYSTEM_READY] assistant.exe' : '◢ DIGITAL ASSISTANT ◤'}
            </p>
            </div>
          </div>

          {/* Información de usuario y logout */}
          <div className="flex items-center space-x-4">
            <div className={`hidden md:flex flex-col text-right ${currentTheme === 'brutalist' ? 'terminal-font' : currentTheme === 'minimal' ? 'system-font' : 'retro-font'}`}>
              <span className="text-sm font-bold" style={headerStyles.userStyle}>
                {currentTheme === 'brutalist' ? `USER: ${(user?.name || 'GUEST').toUpperCase()}` :
                 currentTheme === 'minimal' ? `${user?.name || 'Usuario'}` :
                 `◥ ${user?.name || 'GUEST'} ◤`}
              </span>
              <span className="text-xs" style={headerStyles.emailStyle}>
                {currentTheme === 'brutalist' ? `[${user?.email || 'anonymous@localhost'}]` :
                 user?.email || (currentTheme === 'retro' ? 'guest@retro.net' : 'guest@app.com')}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow"
                title="Menu de usuario"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 px-4 py-2 bg-white border-b">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-2 rounded-lg flex items-center whitespace-nowrap text-sm ${
                activeView === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={14} className="mr-1" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('projects')}
              className={`px-3 py-2 rounded-lg flex items-center whitespace-nowrap text-sm ${
                activeView === 'projects'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Target size={14} className="mr-1" />
              Proyectos
            </button>
            <button
              onClick={() => setActiveView('assistant')}
              className={`px-3 py-2 rounded-lg flex items-center whitespace-nowrap text-sm ${
                activeView === 'assistant'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bot size={14} className="mr-1" />
              Asistente
            </button>
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 py-4">
          {activeView === 'dashboard' ? renderDashboard() :
           activeView === 'projects' ? renderProjectsView() :
           renderAssistantView()}
        </div>
      </div>

      {/* Modal de Configuración del Asistente */}
      {showAssistantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Settings className="mr-2" size={24} />
                  Configuración del Asistente
                </h3>
                <button
                  onClick={() => setShowAssistantModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Nombre del asistente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del asistente
                  </label>
                  <input
                    type="text"
                    value={assistantConfig.assistantName}
                    onChange={(e) => handleConfigChange('assistantName', e.target.value)}
                    placeholder="Nombre de tu asistente"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Tu nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu nombre
                  </label>
                  <input
                    type="text"
                    value={assistantConfig.userName}
                    onChange={(e) => handleConfigChange('userName', e.target.value)}
                    placeholder="¿Cómo te gustaría que te llame?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Especialidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidades
                  </label>
                  {assistantConfig.specialties.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {assistantConfig.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                        >
                          {specialty}
                          <button
                            onClick={() => removeSpecialty(specialty)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableSpecialties.map((specialty) => (
                      <label
                        key={specialty}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={assistantConfig.specialties.includes(specialty)}
                          onChange={() => {
                            if (assistantConfig.specialties.includes(specialty)) {
                              removeSpecialty(specialty);
                            } else {
                              handleConfigChange('specialties', [...assistantConfig.specialties, specialty]);
                            }
                          }}
                          className="mr-2 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>

                  {/* Especialidad personalizada */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCustomSpecialty}
                      onChange={(e) => setNewCustomSpecialty(e.target.value)}
                      placeholder="Especialidad personalizada"
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCustomSpecialty();
                        }
                      }}
                    />
                    <button
                      onClick={addCustomSpecialty}
                      disabled={!newCustomSpecialty.trim()}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Prompt del sistema */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt del sistema
                  </label>
                  <textarea
                    value={assistantConfig.systemPrompt}
                    onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                    placeholder="Define la personalidad y comportamiento de tu asistente..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-vertical"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este prompt define cómo se comportará tu asistente en las conversaciones.
                  </p>
                </div>

                {/* Tono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tono de conversación
                  </label>
                  <select
                    value={assistantConfig.tone}
                    onChange={(e) => handleConfigChange('tone', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Motivador">Motivador</option>
                    <option value="Profesional">Profesional</option>
                    <option value="Amigable">Amigable</option>
                    <option value="Directo">Directo</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAssistantModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    saveAssistantConfig();
                    setShowAssistantModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center"
                >
                  <Save className="mr-1" size={16} />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown de Usuario */}
      {showUserDropdown && (
        <div className="fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 user-dropdown">
          <div className="p-2">
            <button
              onClick={() => {
                setShowUserDropdown(false);
                setShowUserProfileModal(true);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center"
            >
              <User className="mr-2" size={16} />
              Perfil
            </button>

            {/* Selector de Theme */}
            <div className="px-3 py-2 border-t border-gray-100">
              <div className="flex items-center mb-1">
                <Settings className="mr-1" size={12} />
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Theme</label>
              </div>
              <select
                value={currentTheme}
                onChange={(e) => setCurrentTheme(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="retro">🌆 Retro Synthwave</option>
                <option value="minimal">✨ Minimal Elegante</option>
                <option value="brutalist">⚡ Brutalist Tech</option>
                <option value="colorful">🌈 Colorful Gradient</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowUserDropdown(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center"
            >
              <LogOut className="mr-2" size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Modal de Perfil de Usuario */}
      {showUserProfileModal && (
        <>
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <User className="mr-2" size={24} />
                  Configuración de Usuario
                </h3>
                <button
                  onClick={() => setShowUserProfileModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre editable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={userConfig.name}
                    onChange={(e) => setUserConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email solo lectura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userConfig.email}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Cambiar contraseña - Expandible */}
                <div>
                  <div
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <label className="text-sm font-medium text-gray-700 cursor-pointer">
                        Cambiar contraseña (opcional)
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Actualizar contraseña de acceso
                      </p>
                    </div>
                    <div className={`transform transition-transform duration-200 ${showPasswordFields ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {showPasswordFields && (
                    <div className="mt-3 space-y-3" style={{
                      animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={userConfig.newPassword}
                            onChange={(e) => setUserConfig(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full p-2 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contraseña</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={userConfig.confirmPassword}
                            onChange={(e) => setUserConfig(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Repite la nueva contraseña"
                            className="w-full p-2 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {userConfig.newPassword && userConfig.confirmPassword && userConfig.newPassword !== userConfig.confirmPassword && (
                        <p className="text-red-500 text-xs">Las contraseñas no coinciden</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Memoria a largo plazo - Expandible */}
                <div>
                  <div
                    onClick={() => setShowMemoryFields(!showMemoryFields)}
                    className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <label className="text-sm font-medium text-gray-700 cursor-pointer">
                        Memoria a largo plazo (opcional)
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Ayuda al asistente a conocerte mejor
                      </p>
                    </div>
                    <div className={`transform transition-transform duration-200 ${showMemoryFields ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {showMemoryFields && (
                    <div className="mt-3 space-y-3" style={{
                      animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Rasgos de personalidad</label>
                        <textarea
                          value={assistantConfig.memory.personalityTraits}
                          onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, personalityTraits: e.target.value})}
                          placeholder="Ej: Soy una persona analítica y organizada..."
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Qué te motiva</label>
                        <textarea
                          value={assistantConfig.memory.motivationalTriggers}
                          onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, motivationalTriggers: e.target.value})}
                          placeholder="Ej: Me motivan los desafíos, reconocimiento..."
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estilo de aprendizaje</label>
                        <textarea
                          value={assistantConfig.memory.learningStyle}
                          onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, learningStyle: e.target.value})}
                          placeholder="Ej: Aprendo mejor con ejemplos prácticos..."
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Prioridades actuales</label>
                        <textarea
                          value={assistantConfig.memory.currentPriorities}
                          onChange={(e) => handleConfigChange('memory', {...assistantConfig.memory, currentPriorities: e.target.value})}
                          placeholder="Ej: Enfocarme en proyectos de desarrollo web..."
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowUserProfileModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    saveUserConfig();
                    setShowUserProfileModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center"
                >
                  <Save className="mr-1" size={16} />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Modal para crear nuevo proyecto */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Crear Nuevo Proyecto</h3>
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del proyecto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Desarrollo de aplicación móvil"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    placeholder="Describe brevemente el proyecto..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={newProject.priority}
                      onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha límite (opcional)
                    </label>
                    <input
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    addProject();
                    setShowCreateProject(false);
                  }}
                  disabled={!newProject.title.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Crear Proyecto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle del proyecto */}
      {showProjectDetailModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowProjectDetailModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '30px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con título y botón de cierre */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '15px'
            }}>
              {editingProjectTitleId === selectedProject?.id ? (
                <input
                  type="text"
                  value={editingProjectTitleText}
                  onChange={(e) => setEditingProjectTitleText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveProjectTitle();
                    } else if (e.key === 'Escape') {
                      cancelEditingProjectTitle();
                    }
                  }}
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: 0,
                    color: '#1f2937',
                    border: '2px solid #3b82f6',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    background: 'white',
                    width: '100%'
                  }}
                  autoFocus
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: 0,
                    color: '#1f2937'
                  }}>
                    {selectedProject?.title || 'Proyecto'}
                  </h2>
                  <button
                    onClick={() => startEditingProjectTitle(selectedProject.id, selectedProject.title)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#6b7280',
                      borderRadius: '4px'
                    }}
                    title="Editar título"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowProjectDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px',
                  borderRadius: '5px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ✕
              </button>
            </div>

            {/* Descripción del proyecto */}
            {selectedProject?.description && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  color: '#374151'
                }}>
                  Descripción
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {selectedProject?.description}
                </p>
              </div>
            )}

            {/* Estadísticas básicas */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              {/* Información compacta en una línea */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                {/* Stats compactos - izquierda */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flex: '1'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#3b82f6'
                    }}>
                      {selectedProject?.tasks?.length || 0}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      tareas
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#10b981'
                    }}>
                      {selectedProject?.tasks?.filter(t => t.completed).length || 0}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      hechas
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '4px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: (selectedProject?.progress || 0) >= 100 ? '#10b981' : '#3b82f6',
                        width: `${selectedProject?.progress || 0}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      {selectedProject?.progress || 0}%
                    </span>
                  </div>
                </div>

                {/* Controles - derecha */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <select
                    value={selectedProject?.priority || 'media'}
                    onChange={async (e) => {
                      const newPriority = e.target.value;
                      setSelectedProject(prev => ({ ...prev, priority: newPriority }));

                      try {
                        await authenticatedFetch(`${getApiBase()}/projects/${selectedProject?.id}`, {
                          method: 'PUT',
                          body: JSON.stringify({
                            project: { priority: newPriority }
                          })
                        });
                      } catch (error) {
                        console.error('Error actualizando prioridad:', error);
                      }

                      setProjects(projects.map(project =>
                        project.id === selectedProject?.id
                          ? { ...project, priority: newPriority }
                          : project
                      ));
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="baja">🟢 Baja</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🔴 Alta</option>
                  </select>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedProject?.status === 'activo'}
                      onChange={async (e) => {
                        const newStatus = e.target.checked ? 'activo' : 'inactivo';
                        setSelectedProject(prev => ({ ...prev, status: newStatus }));

                        try {
                          await authenticatedFetch(`${getApiBase()}/projects/${selectedProject?.id}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                              project: { status: newStatus }
                            })
                          });
                        } catch (error) {
                          console.error('Error actualizando estado:', error);
                        }

                        setProjects(projects.map(project =>
                          project.id === selectedProject?.id
                            ? { ...project, status: newStatus }
                            : project
                        ));
                      }}
                      style={{
                        width: '14px',
                        height: '14px',
                        accentColor: '#10b981'
                      }}
                    />
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: selectedProject?.status === 'activo' ? '#10b981' : '#6b7280'
                    }}>
                      {selectedProject?.status === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </label>
                </div>
              </div>


            </div>


            {/* Sección de tareas */}
            <div style={{ marginTop: '25px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '15px',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '10px'
              }}>
                Tareas ({selectedProject?.tasks?.length || 0})
              </h3>

              {/* Lista de tareas existentes */}
              {selectedProject?.tasks && selectedProject.tasks.length > 0 && (
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '15px'
                }}>
                  {selectedProject.tasks.map((task, index) => (
                    <div
                      key={task.id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 12px',
                        marginBottom: '8px',
                        backgroundColor: task.completed ? '#f0fdf4' : '#f9fafb',
                        border: task.completed ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        gap: '12px'
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleProjectTaskCompletion(selectedProject.id, task.id)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />

                      {/* Texto de la tarea */}
                      {editingProjectTaskId === task.id ? (
                        <input
                          type="text"
                          value={editingProjectTaskText}
                          onChange={(e) => setEditingProjectTaskText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveTaskName();
                            } else if (e.key === 'Escape') {
                              cancelEditingTaskName();
                            }
                          }}
                          onBlur={saveTaskName}
                          style={{
                            flex: 1,
                            fontSize: '14px',
                            color: '#374151',
                            border: '1px solid #3b82f6',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            background: 'white'
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          onDoubleClick={() => startEditingTaskName(task.id, task.text || task.title || '')}
                          style={{
                            flex: 1,
                            fontSize: '14px',
                            color: task.completed ? '#16a34a' : '#374151',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            fontWeight: task.completed ? '500' : '400',
                            cursor: 'text'
                          }}
                        >
                          {task.text || task.title || 'Tarea sin título'}
                        </span>
                      )}

                      {/* Input de progreso */}
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress || 0}
                        onChange={(e) => {
                          const newProgress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          updateTaskProgress(selectedProject.id, task.id, newProgress);
                        }}
                        style={{
                          width: '50px',
                          padding: '2px 4px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>%</span>

                      {/* Barra de progreso mini */}
                      <div style={{
                        width: '60px',
                        height: '4px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: task.completed ? '#16a34a' : '#3b82f6',
                          width: `${task.progress || 0}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      {/* Botones de acción */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {task.completed && (
                          <CheckCircle
                            size={16}
                            style={{
                              color: '#16a34a'
                            }}
                          />
                        )}
                        <button
                          onClick={() => updateTaskProgress(selectedProject.id, task.id, 100)}
                          style={{
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            cursor: 'pointer'
                          }}
                        >
                          100%
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProjectTask(selectedProject.id, task.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: '#ef4444',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Eliminar tarea"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón minimalista estilo Trello para agregar nueva tarea */}
              {!isAddingTask ? (
                <div
                  onClick={() => {
                    console.log('🖱️ Click en agregar tarea - activando modo edición');
                    setIsAddingTask(true);
                    setTimeout(() => {
                      const input = document.getElementById('newTaskInput');
                      if (input) {
                        input.focus();
                      }
                    }, 50);
                  }}
                  style={{
                    marginTop: '15px',
                    padding: '8px 12px',
                    borderRadius: '3px',
                    border: '2px dashed #d1d5db',
                    color: '#5e6c84',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'transparent',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e4e6ea';
                    e.target.style.color = '#172b4d';
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#5e6c84';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                >
                  <Plus size={14} />
                  Agregar nueva tarea
                </div>
              ) : (
                <div style={{
                  marginTop: '15px',
                  padding: '8px',
                  borderRadius: '3px',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 0 rgba(9,30,66,.25)'
                }}>
                  <input
                    id="newTaskInput"
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newTaskText.trim()) {
                        addTaskFromModal(selectedProject.id);
                      }
                      if (e.key === 'Escape') {
                        setNewTaskText('');
                        setIsAddingTask(false);
                      }
                    }}
                    placeholder="Introduzca un título para esta tarjeta..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: '20px',
                      fontFamily: 'inherit'
                    }}
                    autoFocus
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={() => {
                        console.log('🖱️ Click en botón Agregar');
                        addTaskFromModal(selectedProject.id);
                      }}
                      disabled={!newTaskText.trim()}
                      style={{
                        backgroundColor: newTaskText.trim() ? '#0ea5e9' : '#ddd',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '3px',
                        cursor: newTaskText.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '400',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (newTaskText.trim()) {
                          e.target.style.backgroundColor = '#0284c7';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newTaskText.trim()) {
                          e.target.style.backgroundColor = '#0ea5e9';
                        }
                      }}
                    >
                      Agregar tarea
                    </button>
                    <button
                      onClick={() => {
                        setNewTaskText('');
                        setIsAddingTask(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        color: '#6b778c',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Cancelar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '20px'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    // Verificar si el proyecto está activo y tiene tareas
                    const isActive = selectedProject.status === 'activo';
                    const hasTasks = selectedProject.tasks && selectedProject.tasks.length > 0;

                    if (isActive && hasTasks) {
                      alert('No puedes eliminar un proyecto activo que tiene tareas. Puedes cambiarlo a inactivo primero o eliminar todas sus tareas.');
                      return;
                    }

                    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
                      deleteProject(selectedProject.id);
                      setShowProjectDetailModal(false);
                    }
                  }}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={16} />
                  Eliminar Proyecto
                </button>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span>
                  <span style={{ fontWeight: '600' }}>
                    {selectedProject?.tasks?.filter(t => t.completed).length || 0}
                  </span> de{' '}
                  <span style={{ fontWeight: '600' }}>
                    {selectedProject?.tasks?.length || 0}
                  </span> tareas completadas
                </span>
              </div>
              <button
                onClick={() => setShowProjectDetailModal(false)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalCoachAssistant;
