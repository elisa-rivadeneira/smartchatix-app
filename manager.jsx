import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, CheckCircle, Calendar, Target, TrendingUp, Settings, Archive, Play, Trash2, Edit3, Bot, User, MessageCircle, Send, Save, CheckCircle2, Mic, MicOff, Volume2, VolumeX, LogOut, Eye, EyeOff, ChevronDown, ChevronRight, AlertCircle, Clock } from 'lucide-react';
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

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
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

// Helper function para manejar fechas correctamente evitando problemas de zona horaria
const parseLocalDate = (dateString) => {
  if (!dateString) return null;

  // Si es un string de fecha YYYY-MM-DD, parsearlo como fecha local
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  return new Date(dateString);
};

// Helper function para formatear fecha como YYYY-MM-DD
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


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
  const longPressTimerRef = useRef(null);

  // Estados para funciones de voz
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecordingComplete, setIsRecordingComplete] = useState(false);


  // Chat Bubble state
  const [chatBubbleOpen, setChatBubbleOpen] = useState(false);
  const [chatBubbleMinimized, setChatBubbleMinimized] = useState(false);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const timeoutRef = useRef(null);


  // Keyboard shortcuts for AI interactions
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + Shift + A: Switch to Assistant
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setActiveView('assistant');
        return;
      }


      // Quick AI prompts (only in assistant view)
      if (activeView === 'assistant') {
        // Ctrl/Cmd + 1: Project analysis
        if ((event.ctrlKey || event.metaKey) && event.key === '1') {
          event.preventDefault();
          setNewMessage(`Analiza mis ${projects.length} proyectos y dime cuáles necesitan más atención`);
          return;
        }

        // Ctrl/Cmd + 2: Task optimization
        if ((event.ctrlKey || event.metaKey) && event.key === '2') {
          event.preventDefault();
          const pendingTasks = projects.reduce((total, project) =>
            total + (project.tasks?.filter(task => !task.completed).length || 0), 0
          );
          setNewMessage(`Tengo ${pendingTasks} tareas pendientes. ¿Cómo puedo priorizarlas mejor?`);
          return;
        }

        // Ctrl/Cmd + 3: Time-based coaching
        if ((event.ctrlKey || event.metaKey) && event.key === '3') {
          event.preventDefault();
          const currentHour = new Date().getHours();
          const timeBasedPrompt = currentHour < 12
            ? 'Dame una estrategia productiva para empezar bien el día'
            : currentHour < 18
            ? 'Necesito mantener el foco y energía para la tarde'
            : 'Ayúdame a planificar el día de mañana y cerrar bien hoy';
          setNewMessage(timeBasedPrompt);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeView, projects]);

  // Función para cargar datos específicos del usuario
  const loadUserData = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${getApiBase()}/profile`);
      if (response.ok) {
        const data = await response.json();

        console.log('🔍 [DEBUG] Datos recibidos del backend:', data);
        console.log('🔍 [DEBUG] Proyectos en respuesta:', data.projects);
        console.log('🔍 [DEBUG] Número de proyectos:', data.projects?.length);

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
  const updateTaskProgress = async (projectId, taskId, newProgress) => {
    const progressValue = Math.max(0, Math.min(100, parseInt(newProgress) || 0));

    // Actualizar estado local
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

        // Calcular el progreso promedio del proyecto
        const totalProgress = updatedTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
        const averageProgress = updatedTasks.length > 0 ? Math.round(totalProgress / updatedTasks.length) : 0;

        return { ...project, tasks: updatedTasks, progress: averageProgress };
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

    // Actualizar selectedProject si es el mismo proyecto
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

    // Guardar cambios en la base de datos
    try {
      const projectToUpdate = projects.find(p => p.id === projectId);
      if (projectToUpdate) {
        const updatedTasks = projectToUpdate.tasks.map(task => {
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

        await authenticatedFetch(`${getApiBase()}/projects/${projectId}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: {
              ...projectToUpdate,
              tasks: updatedTasks,
              progress: averageProgress
            }
          })
        });
      }
    } catch (error) {
      console.error('Error guardando progreso de tarea:', error);
    }

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
    },
    {
      name: "update_project_status",
      description: "Cambiar el estado de un proyecto (activo/inactivo/completado)",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título del proyecto a actualizar"
          },
          status: {
            type: "string",
            enum: ["activo", "inactivo", "completado"],
            description: "Nuevo estado del proyecto"
          }
        },
        required: ["project_title", "status"]
      }
    },
    {
      name: "update_project_deadline",
      description: "Cambiar o establecer la fecha límite de un proyecto",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título del proyecto a actualizar"
          },
          deadline: {
            type: "string",
            description: "Nueva fecha límite en formato YYYY-MM-DD (ej: 2024-12-31) o 'remove' para eliminar"
          }
        },
        required: ["project_title", "deadline"]
      }
    },
    {
      name: "update_project_priority",
      description: "Cambiar la prioridad de un proyecto",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título del proyecto a actualizar"
          },
          priority: {
            type: "string",
            enum: ["baja", "media", "alta"],
            description: "Nueva prioridad del proyecto"
          }
        },
        required: ["project_title", "priority"]
      }
    },
    {
      name: "update_project_details",
      description: "Cambiar el título o descripción de un proyecto",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título actual del proyecto a actualizar"
          },
          new_title: {
            type: "string",
            description: "Nuevo título del proyecto (opcional)"
          },
          new_description: {
            type: "string",
            description: "Nueva descripción del proyecto (opcional)"
          }
        },
        required: ["project_title"]
      }
    },
    {
      name: "delete_project",
      description: "Eliminar un proyecto completamente (solo si no tiene tareas pendientes)",
      parameters: {
        type: "object",
        properties: {
          project_title: {
            type: "string",
            description: "Título del proyecto a eliminar"
          }
        },
        required: ["project_title"]
      }
    }
  ];

  // Función para ejecutar las acciones del asistente
  const executeAssistantFunction = async (functionName, parameters) => {
    console.log('🔍 [DEBUG] executeAssistantFunction llamada con:', functionName, parameters);

    switch (functionName) {
      case "create_project":
        return createProjectFromAssistant(parameters);
      case "add_project_task":
        return addProjectTaskFromAssistant(parameters);
      case "update_task_progress":
        return await updateTaskProgressFromAssistant(parameters);
      case "add_task_to_daily_focus":
        return addTaskToDailyFocusFromAssistant(parameters);
      case "get_projects_status":
        console.log('🔍 [DEBUG] Ejecutando get_projects_status');
        return getProjectsStatusFromAssistant();
      case "update_project_status":
        return await updateProjectStatusFromAssistant(parameters);
      case "update_project_deadline":
        return await updateProjectDeadlineFromAssistant(parameters);
      case "update_project_priority":
        return await updateProjectPriorityFromAssistant(parameters);
      case "update_project_details":
        return await updateProjectDetailsFromAssistant(parameters);
      case "delete_project":
        return await deleteProjectFromAssistant(parameters);
      default:
        console.log('🔍 [DEBUG] Función no reconocida:', functionName);
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
        ? `Con fecha límite para el ${parseLocalDate(params.deadline).toLocaleDateString()}, `
        : "";

      return {
        success: true,
        message: `Perfecto, he creado el proyecto "${params.title}" ${deadlineMessage}${motivationalMessage}

¿Qué tareas concretas necesitas para avanzar? Puedes decirme varias y las agrego todas juntas para que puedas empezar a trabajar.`,
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
        message: `${encouragement}He agregado "${params.task_title}" al proyecto "${project.title}". ¿Quieres que la pongamos en tu enfoque de hoy para empezar a trabajar? O si tienes más tareas en mente, dímelas.`,
        task_id: task.id
      };
    } catch (error) {
      return { success: false, message: "Error al agregar la tarea: " + error.message };
    }
  };

  const updateTaskProgressFromAssistant = async (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      const task = project.tasks.find(t => t.title.toLowerCase().includes(params.task_title.toLowerCase()));
      if (!task) {
        return { success: false, message: `No se encontró la tarea "${params.task_title}" en el proyecto "${project.title}".` };
      }

      await updateTaskProgress(project.id, task.id, params.progress);

      // Mensajes motivacionales según el progreso
      let progressMessage = "";
      if (params.progress === 100) {
        progressMessage = "¡Perfecto! Has terminado esta tarea completamente.";
      } else if (params.progress >= 75) {
        progressMessage = "Excelente, ya casi terminas.";
      } else if (params.progress >= 50) {
        progressMessage = "Vas por buen camino, ya tienes más de la mitad.";
      } else if (params.progress >= 25) {
        progressMessage = "Buen avance para empezar.";
      } else {
        progressMessage = "Perfecto, todo proyecto empieza con el primer paso.";
      }

      return {
        success: true,
        message: `${progressMessage} He actualizado "${task.title}" al ${params.progress}%. ${params.progress === 100 ? "¿Qué sigue ahora?" : "¿Necesitas ajustar algo más?"}`
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
        message: `Perfecto, he agregado "${task.title}" a tu enfoque de hoy. Ahora tienes algo concreto para avanzar en "${project.title}". ¿Hay alguna otra tarea que quieras priorizar para hoy?`
      };
    } catch (error) {
      return { success: false, message: "Error al agregar al enfoque diario: " + error.message };
    }
  };

  const getProjectsStatusFromAssistant = () => {
    try {
      console.log('🔍 [DEBUG] getProjectsStatusFromAssistant - proyectos disponibles:', projects);
      console.log('🔍 [DEBUG] Número de proyectos:', projects.length);
      console.log('🔍 [DEBUG] Usuario autenticado:', isAuthenticated);
      console.log('🔍 [DEBUG] Estado de carga:', authLoading);

      // Verificar si los datos están cargados
      if (authLoading) {
        console.log('🔍 [DEBUG] Datos aún cargando...');
        return {
          success: true,
          message: "Estoy cargando tus datos, dame un momento..."
        };
      }

      if (!projects || projects.length === 0) {
        console.log('🔍 [DEBUG] No hay proyectos disponibles');
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
      const completedTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);

      console.log('🔍 [DEBUG] Proyectos activos encontrados:', activeProjects);
      console.log('🔍 [DEBUG] Número de proyectos activos:', activeProjects.length);
      console.log('🔍 [DEBUG] Tareas completadas en total:', completedTasks);

      // Mostrar detalles de cada proyecto
      activeProjects.forEach((project, index) => {
        console.log(`🔍 [DEBUG] Proyecto ${index + 1}: ${project.title} - Status: ${project.status} - Tareas: ${project.tasks?.length || 0}`);
        if (project.tasks) {
          project.tasks.forEach((task, taskIndex) => {
            console.log(`  🔍 [DEBUG] Tarea ${taskIndex + 1}: ${task.title} - Completada: ${task.completed} - Progreso: ${task.progress || 0}%`);
          });
        }
      });

      // Generar un mensaje más conversacional y humano
      let statusMessage = "";

      if (activeProjects.length === 0) {
        console.log('🔍 [DEBUG] No se encontraron proyectos activos');
        statusMessage = "Veo que no tienes proyectos activos en este momento. ¿Te gustaría que te ayude a planificar alguno nuevo o hay algo específico en lo que quieras trabajar hoy?";
      } else if (activeProjects.length === 1) {
        const project = activeProjects[0];
        const completedProjectTasks = project.tasks.filter(t => t.completed).length;
        const totalProjectTasks = project.tasks.length;

        if (totalProjectTasks === 0) {
          statusMessage = `Tienes un proyecto activo: "${project.title}". Aún no tiene tareas definidas, así que podríamos empezar por planificar los primeros pasos. ¿Qué te parece si definimos algunas tareas concretas para avanzar?`;
        } else {
          const progressText = project.progress > 70 ? "¡Va muy bien!" : project.progress > 40 ? "va por buen camino" : "está empezando a tomar forma";
          statusMessage = `Tu proyecto "${project.title}" ${progressText} Has completado ${completedProjectTasks} de ${totalProjectTasks} tareas`;

          if (project.deadline) {
            const deadlineDate = parseLocalDate(project.deadline);
            const today = new Date();
            const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 3) {
              statusMessage += ` y la fecha límite está cerca (${project.deadline})`;
            } else if (daysLeft <= 7) {
              statusMessage += ` y tienes una semana para terminarlo`;
            }
          }

          statusMessage += ". ¿En qué tarea te gustaría enfocar hoy?";
        }
      } else {
        // Múltiples proyectos
        const projectWithMostProgress = activeProjects.reduce((max, project) =>
          project.progress > max.progress ? project : max, activeProjects[0]);

        const urgentProjects = activeProjects.filter(p => {
          if (!p.deadline) return false;
          const deadlineDate = parseLocalDate(p.deadline);
          const today = new Date();
          const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
          return daysLeft <= 7;
        });

        if (urgentProjects.length > 0) {
          statusMessage = `Tienes ${activeProjects.length} proyectos activos. Me llama la atención que "${urgentProjects[0].title}" tiene fecha límite próxima. Te sugiero enfocarte en eso hoy`;
        } else if (projectWithMostProgress.progress > 50) {
          statusMessage = `Veo que tienes ${activeProjects.length} proyectos en marcha. "${projectWithMostProgress.title}" está avanzando bien (${projectWithMostProgress.progress}%), quizás sea buena idea impulsarlo un poco más para terminarlo pronto`;
        } else {
          statusMessage = `Tienes ${activeProjects.length} proyectos activos. Para ser más efectivo, te recomiendo elegir uno y enfocarte en él hoy`;
        }

        if (completedTasks > 0) {
          statusMessage += `. Has completado ${completedTasks} tareas en total, ¡buen ritmo!`;
        }

        statusMessage += " ¿Cuál quieres priorizar?";
      }

      console.log('🔍 [DEBUG] Mensaje generado:', statusMessage);

      // Agregar datos estructurados para que el asistente pueda responder preguntas específicas
      const structuredData = {
        projects: activeProjects.map(project => ({
          title: project.title,
          status: project.status,
          priority: project.priority,
          deadline: project.deadline,
          progress: project.progress || 0,
          tasks: project.tasks?.map(task => ({
            title: task.title,
            completed: task.completed,
            progress: task.progress || 0
          })) || [],
          pendingTasks: project.tasks?.filter(task => !task.completed) || [],
          completedTasks: project.tasks?.filter(task => task.completed) || []
        })),
        summary: {
          totalActiveProjects: activeProjects.length,
          totalTasks: activeProjects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0),
          totalPendingTasks: activeProjects.reduce((sum, p) => sum + (p.tasks?.filter(t => !t.completed).length || 0), 0),
          totalCompletedTasks: completedTasks
        }
      };

      const result = {
        success: true,
        message: statusMessage,
        data: structuredData
      };
      console.log('🔍 [DEBUG] Resultado de getProjectsStatusFromAssistant:', result);
      return result;
    } catch (error) {
      return { success: false, message: "Error al obtener información de proyectos: " + error.message };
    }
  };

  const updateProjectStatusFromAssistant = async (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      // Actualizar el estado del proyecto
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === project.id ? { ...p, status: params.status } : p
        )
      );

      // Actualizar selectedProject si es el mismo
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(prev => ({ ...prev, status: params.status }));
      }

      // Guardar cambios en la base de datos
      try {
        await authenticatedFetch(`${getApiBase()}/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: { ...project, status: params.status }
          })
        });

        // Recargar datos para sincronizar con la base de datos
        await loadUserData();
      } catch (error) {
        console.error('Error guardando estado del proyecto:', error);
      }

      let statusMessage = "";
      switch (params.status) {
        case 'inactivo':
          statusMessage = `✅ Perfecto, he marcado el proyecto "${project.title}" como inactivo. Ya no aparecerá en tu lista de proyectos activos.`;
          break;
        case 'completado':
          statusMessage = `🎉 ¡Excelente! Has completado el proyecto "${project.title}". ¡Felicitaciones por terminar este proyecto!`;
          break;
        case 'activo':
          statusMessage = `✅ El proyecto "${project.title}" está ahora activo y aparecerá en tu lista de trabajo.`;
          break;
        default:
          statusMessage = `✅ He actualizado el estado del proyecto "${project.title}" a ${params.status}.`;
      }

      return { success: true, message: statusMessage };
    } catch (error) {
      return { success: false, message: "Error al actualizar el estado del proyecto: " + error.message };
    }
  };

  const updateProjectDeadlineFromAssistant = async (params) => {
    try {
      console.log('🔍 [DEBUG] updateProjectDeadlineFromAssistant llamada con params:', params);
      console.log('🔍 [DEBUG] Fecha recibida del asistente:', params.deadline);

      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      const newDeadline = params.deadline === 'remove' ? null : params.deadline;
      console.log('🔍 [DEBUG] Nueva fecha procesada:', newDeadline);

      // Actualizar el deadline del proyecto
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === project.id ? { ...p, deadline: newDeadline } : p
        )
      );

      // Actualizar selectedProject si es el mismo
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(prev => ({ ...prev, deadline: newDeadline }));
      }

      // Guardar cambios en la base de datos
      try {
        await authenticatedFetch(`${getApiBase()}/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: { ...project, deadline: newDeadline }
          })
        });

        // Recargar datos para sincronizar con la base de datos
        await loadUserData();
      } catch (error) {
        console.error('Error guardando deadline del proyecto:', error);
      }

      const statusMessage = newDeadline
        ? `✅ He actualizado la fecha límite del proyecto "${project.title}" para el ${newDeadline}.`
        : `✅ He eliminado la fecha límite del proyecto "${project.title}".`;

      return { success: true, message: statusMessage };
    } catch (error) {
      return { success: false, message: "Error al actualizar la fecha límite: " + error.message };
    }
  };

  const updateProjectPriorityFromAssistant = async (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      // Actualizar la prioridad del proyecto
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === project.id ? { ...p, priority: params.priority } : p
        )
      );

      // Actualizar selectedProject si es el mismo
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(prev => ({ ...prev, priority: params.priority }));
      }

      // Guardar cambios en la base de datos
      try {
        await authenticatedFetch(`${getApiBase()}/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: { ...project, priority: params.priority }
          })
        });

        // Recargar datos para sincronizar con la base de datos
        await loadUserData();
      } catch (error) {
        console.error('Error guardando prioridad del proyecto:', error);
      }

      return { success: true, message: `✅ He cambiado la prioridad del proyecto "${project.title}" a ${params.priority}.` };
    } catch (error) {
      return { success: false, message: "Error al actualizar la prioridad: " + error.message };
    }
  };

  const updateProjectDetailsFromAssistant = async (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      const newTitle = params.new_title || project.title;
      const newDescription = params.new_description !== undefined ? params.new_description : project.description;

      // Actualizar los detalles del proyecto
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === project.id ? { ...p, title: newTitle, description: newDescription } : p
        )
      );

      // Actualizar selectedProject si es el mismo
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(prev => ({ ...prev, title: newTitle, description: newDescription }));
      }

      // Guardar cambios en la base de datos
      try {
        await authenticatedFetch(`${getApiBase()}/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: { ...project, title: newTitle, description: newDescription }
          })
        });

        // Recargar datos para sincronizar con la base de datos
        await loadUserData();
      } catch (error) {
        console.error('Error guardando detalles del proyecto:', error);
      }

      let statusMessage = "✅ He actualizado el proyecto ";
      if (params.new_title && params.new_description !== undefined) {
        statusMessage += `cambiando el título a "${newTitle}" y la descripción.`;
      } else if (params.new_title) {
        statusMessage += `cambiando el título a "${newTitle}".`;
      } else if (params.new_description !== undefined) {
        statusMessage += `"${project.title}" actualizando su descripción.`;
      }

      return { success: true, message: statusMessage };
    } catch (error) {
      return { success: false, message: "Error al actualizar los detalles del proyecto: " + error.message };
    }
  };

  const deleteProjectFromAssistant = async (params) => {
    try {
      const project = projects.find(p => p.title.toLowerCase().includes(params.project_title.toLowerCase()));
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      // Verificar si tiene tareas pendientes
      const pendingTasks = project.tasks?.filter(task => !task.completed) || [];
      if (pendingTasks.length > 0) {
        return {
          success: false,
          message: `❌ No puedo eliminar el proyecto "${project.title}" porque tiene ${pendingTasks.length} tareas pendientes. Completa o elimina las tareas primero.`
        };
      }

      // Eliminar proyecto de la base de datos
      try {
        await authenticatedFetch(`${getApiBase()}/projects/${project.id}`, {
          method: 'DELETE'
        });

        // Recargar datos para sincronizar con la base de datos
        await loadUserData();
      } catch (error) {
        console.error('Error eliminando proyecto:', error);
        return { success: false, message: "Error al eliminar el proyecto de la base de datos." };
      }

      // Si es el proyecto seleccionado, limpiar la selección
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(null);
      }

      return { success: true, message: `🗑️ He eliminado completamente el proyecto "${project.title}".` };
    } catch (error) {
      return { success: false, message: "Error al eliminar el proyecto: " + error.message };
    }
  };

  // === SISTEMA DE MEMORIA CONVERSACIONAL ACTIVA ===

  // Función para guardar mensajes en el historial
  const saveConversationMessage = async (type, content, functionResults = null) => {
    try {
      const messageData = {
        id: Date.now().toString(),
        type, // 'user' o 'assistant'
        content,
        function_results: functionResults ? JSON.stringify(functionResults) : null
      };

      await authenticatedFetch(`${getApiBase()}/chat/message`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
    } catch (error) {
      console.error('Error guardando mensaje:', error);
    }
  };

  // Función para registrar insights automáticamente
  const recordInsight = async (type, content, context = null, importance = 3) => {
    try {
      const insight = {
        id: Date.now().toString(),
        insight_type: type,
        content,
        context,
        importance_level: importance
      };

      await authenticatedFetch(`${getApiBase()}/insights`, {
        method: 'POST',
        body: JSON.stringify(insight)
      });
    } catch (error) {
      console.error('Error registrando insight:', error);
    }
  };

  // Función para registrar compromisos
  const recordCommitment = async (commitment, deadline = null) => {
    try {
      const commitmentData = {
        id: Date.now().toString(),
        commitment,
        deadline
      };

      await authenticatedFetch(`${getApiBase()}/commitments`, {
        method: 'POST',
        body: JSON.stringify(commitmentData)
      });
    } catch (error) {
      console.error('Error registrando compromiso:', error);
    }
  };

  // Función para registrar logros
  const recordAchievement = async (achievement, type, projectId = null, level = 3) => {
    try {
      const achievementData = {
        id: Date.now().toString(),
        achievement,
        achievement_type: type,
        related_project_id: projectId,
        celebration_level: level
      };

      await authenticatedFetch(`${getApiBase()}/achievements`, {
        method: 'POST',
        body: JSON.stringify(achievementData)
      });
    } catch (error) {
      console.error('Error registrando logro:', error);
    }
  };

  // Función para obtener memoria conversacional
  const getConversationalMemory = async () => {
    try {
      const [insightsRes, commitmentsRes, achievementsRes] = await Promise.all([
        authenticatedFetch(`${getApiBase()}/insights`),
        authenticatedFetch(`${getApiBase()}/commitments`),
        authenticatedFetch(`${getApiBase()}/achievements`)
      ]);

      const insights = await insightsRes.json();
      const commitments = await commitmentsRes.json();
      const achievements = await achievementsRes.json();

      return { insights, commitments, achievements };
    } catch (error) {
      console.error('Error obteniendo memoria conversacional:', error);
      return { insights: [], commitments: [], achievements: [] };
    }
  };

  // Función para analizar conversación y extraer insights automáticamente
  const analyzeConversationForInsights = async (userMessage, assistantResponse) => {
    try {
      // Detectar logros en la conversación
      if (userMessage.toLowerCase().includes('terminé') ||
          userMessage.toLowerCase().includes('completé') ||
          userMessage.toLowerCase().includes('logré')) {
        await recordAchievement(userMessage, 'task_completion', null, 4);
        await recordInsight('achievement', `Usuario reportó: ${userMessage}`, null, 4);
      }

      // Detectar compromisos
      if (userMessage.toLowerCase().includes('voy a') ||
          userMessage.toLowerCase().includes('me comprometo') ||
          userMessage.toLowerCase().includes('para mañana') ||
          userMessage.toLowerCase().includes('esta semana')) {
        await recordCommitment(userMessage);
        await recordInsight('goal', `Nuevo compromiso: ${userMessage}`, null, 4);
      }

      // Detectar patrones de procrastinación
      if (userMessage.toLowerCase().includes('no pude') ||
          userMessage.toLowerCase().includes('se me olvidó') ||
          userMessage.toLowerCase().includes('no tuve tiempo')) {
        await recordInsight('pattern', `Patrón de retraso: ${userMessage}`, null, 3);
      }

      // Detectar desafíos
      if (userMessage.toLowerCase().includes('problema') ||
          userMessage.toLowerCase().includes('difícil') ||
          userMessage.toLowerCase().includes('no sé cómo')) {
        await recordInsight('challenge', `Desafío identificado: ${userMessage}`, null, 4);
      }
    } catch (error) {
      console.error('Error analizando conversación:', error);
    }
  };

  // Función para construir el prompt del sistema basado en la configuración
  const buildSystemPrompt = async () => {
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

    // Construir memoria conversacional (insights, compromisos, logros)
    const buildConversationalMemory = async () => {
      try {
        const { insights, commitments, achievements } = await getConversationalMemory();
        let conversationalMemory = "\n\n🧠 MEMORIA CONVERSACIONAL (Lo que he aprendido en nuestras conversaciones):";

        // Insights importantes ordenados por importancia
        const importantInsights = insights.filter(i => i.importance_level >= 4).slice(0, 5);
        if (importantInsights.length > 0) {
          conversationalMemory += "\n\n💡 INSIGHTS CLAVE:";
          importantInsights.forEach(insight => {
            conversationalMemory += `\n• [${insight.insight_type.toUpperCase()}] ${insight.content}`;
          });
        }

        // Compromisos pendientes
        const pendingCommitments = commitments.filter(c => c.status === 'pending').slice(0, 3);
        if (pendingCommitments.length > 0) {
          conversationalMemory += "\n\n🎯 COMPROMISOS PENDIENTES QUE DEBES RECORDAR:";
          pendingCommitments.forEach(commitment => {
            const daysAgo = Math.floor((new Date() - new Date(commitment.created_at)) / (1000 * 60 * 60 * 24));
            conversationalMemory += `\n• "${commitment.commitment}" (hace ${daysAgo} días)`;
            if (commitment.follow_up_count > 0) {
              conversationalMemory += ` - Ya le he preguntado ${commitment.follow_up_count} veces`;
            }
          });
        }

        // Logros recientes no reconocidos
        const unacknowledgedAchievements = achievements.filter(a => !a.acknowledged).slice(0, 3);
        if (unacknowledgedAchievements.length > 0) {
          conversationalMemory += "\n\n🏆 LOGROS RECIENTES A CELEBRAR:";
          unacknowledgedAchievements.forEach(achievement => {
            conversationalMemory += `\n• ${achievement.achievement}`;
          });
        }

        // Patrones detectados
        const patterns = insights.filter(i => i.insight_type === 'pattern').slice(0, 3);
        if (patterns.length > 0) {
          conversationalMemory += "\n\n⚠️ PATRONES A CONFRONTAR:";
          patterns.forEach(pattern => {
            conversationalMemory += `\n• ${pattern.content}`;
          });
        }

        return conversationalMemory;
      } catch (error) {
        console.error('Error construyendo memoria conversacional:', error);
        return "\n\n🧠 MEMORIA CONVERSACIONAL: Cargando datos de conversaciones anteriores...";
      }
    };

    // Construir contexto de proyectos actual
    const buildProjectContext = () => {
      if (projects.length === 0) {
        return "El usuario aún no tiene proyectos creados. Sugiere crear algunos y ayúdale con la gestión inicial.";
      }

      const activeProjects = projects.filter(p => p.status === 'active');
      const inactiveProjects = projects.filter(p => p.status === 'inactive');
      const totalTasks = projects.reduce((total, project) => total + (project.tasks?.length || 0), 0);
      const completedTasks = projects.reduce((total, project) =>
        total + (project.tasks?.filter(task => task.completed).length || 0), 0
      );
      const pendingTasks = totalTasks - completedTasks;

      let projectContext = `\nESTADO ACTUAL DE PROYECTOS DEL USUARIO:
• Total de proyectos: ${projects.length}
• Proyectos activos: ${activeProjects.length}
• Proyectos inactivos: ${inactiveProjects.length}
• Total de tareas: ${totalTasks}
• Tareas completadas: ${completedTasks}
• Tareas pendientes: ${pendingTasks}`;

      if (activeProjects.length > 0) {
        projectContext += `\n\nPROYECTOS ACTIVOS EN DETALLE:`;
        activeProjects.forEach(project => {
          const projectTasks = project.tasks || [];
          const projectCompletedTasks = projectTasks.filter(t => t.completed).length;
          const projectPendingTasks = projectTasks.length - projectCompletedTasks;

          projectContext += `\n📋 "${project.title}"`;
          if (project.description) projectContext += ` - ${project.description}`;
          if (project.priority) projectContext += ` (Prioridad: ${project.priority})`;
          if (project.deadline) projectContext += ` (Fecha límite: ${project.deadline})`;
          projectContext += `\n   • Tareas: ${projectTasks.length} total, ${projectCompletedTasks} completadas, ${projectPendingTasks} pendientes`;

          if (projectPendingTasks > 0) {
            const pendingTasksList = projectTasks.filter(t => !t.completed).slice(0, 3);
            projectContext += `\n   • Próximas tareas: ${pendingTasksList.map(t => t.title || t.text).join(', ')}`;
            if (projectPendingTasks > 3) projectContext += ` y ${projectPendingTasks - 3} más...`;
          }
        });
      }

      // Análisis de patrones y sugerencias
      projectContext += `\n\nANÁLISIS INTELIGENTE:`;
      if (pendingTasks > completedTasks) {
        projectContext += `\n• 🎯 FOCO RECOMENDADO: El usuario tiene más tareas pendientes (${pendingTasks}) que completadas (${completedTasks}). Ayúdale con priorización.`;
      }
      if (activeProjects.length > 3) {
        projectContext += `\n• ⚠️ CARGA DE TRABAJO: ${activeProjects.length} proyectos activos pueden ser demasiados. Considera sugerir enfoques o priorización.`;
      }
      if (activeProjects.some(p => p.priority === 'alta')) {
        const highPriorityProjects = activeProjects.filter(p => p.priority === 'alta');
        projectContext += `\n• 🚨 URGENTE: ${highPriorityProjects.length} proyecto(s) de alta prioridad: ${highPriorityProjects.map(p => p.title).join(', ')}`;
      }

      return projectContext;
    };

    return `${assistantConfig.basePrompt}

INFORMACIÓN PERSONAL:
- Mi nombre es ${assistantName}
- Estoy hablando con ${userName}
- Soy ${specialtiesText}

CONTEXTO DEL PROYECTO:
- Somos socios en **SmartChatix**, nuestro proyecto de startup
- Es una plataforma de chat inteligente que estamos desarrollando juntos
- Hablamos como emprendedores que están construyendo algo genial
- Compartimos la emoción, los retos y los logros del proyecto
- Usamos lenguaje natural, como amigos que colaboran codo a codo

PERSONALIDAD Y ROL:
Eres mi SOCIO en SmartChatix - hablamos como amigos emprendedores que construyen algo juntos:

🤝 SOCIO EMPRENDEDOR:
- Habla como si fuéramos compañeros de startup trabajando codo a codo
- Usa "nosotros", "nuestro proyecto", "vamos a lograrlo"
- Muestra emoción genuina por los avances: "¡Eso está genial!"
- Comparte la presión y celebra los éxitos como si fueran tuyos también
- Sé auténtico: "Oye, ¿cómo vamos con eso que planificamos?"

💬 CONVERSACIÓN NATURAL:
- Habla como un amigo cercano, no como un reporte corporativo
- Usa lenguaje coloquial y relajado: "¿Qué tal?", "¿Cómo vas?"
- Haz comentarios casuales y mantén el ambiente light cuando sea apropiado
- Pregunta por su estado de ánimo: "¿Cómo te sientes hoy?"
- Usa humor ligero y comentarios divertidos para aliviar tensión

🎯 MOTIVACIÓN INTELIGENTE:
- Empuja cuando sea necesario, pero con cariño y comprensión
- "Oye, sé que puedes hacer más, ¿qué necesitas?"
- Reconoce esfuerzos: "Vi que trabajaste duro ayer, ¿descansaste?"
- Cuando confrontes, hazlo con curiosidad, no juicio: "¿Qué crees que pasó aquí?"
- Celebra MUCHO los logros, por pequeños que sean

🔥 ENERGÍA EMPRENDEDORA:
- Mantén la energía alta pero sin ser abrumador
- Comparte la visión: "SmartChatix va a ser increíble"
- Genera entusiasmo por el futuro: "¡Imagínate cuando tengamos esto listo!"
- Sé realista pero optimista: "Va a ser trabajo, pero lo vamos a lograr"
- Mantén el foco en el impacto, no solo en las tareas

FECHA Y HORA ACTUAL:
- Hoy es ${dateString}
- Son las ${timeString}
- Usa esta información para referencias de tiempo relativas (ej: "en una semana", "mañana", "la próxima semana", etc.)

⚠️ IMPORTANTE: Para responder sobre proyectos/tareas, SIEMPRE llama primero a get_projects_status para obtener datos actualizados.

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
6. update_project_status - Puedo cambiar el estado de un proyecto (activo/inactivo/completado)

INSTRUCCIONES CRÍTICAS PARA USO DE FUNCIONES:
- NUNCA respondas sobre proyectos o tareas sin PRIMERO llamar a get_projects_status
- SIEMPRE debes llamar a get_projects_status para CUALQUIER pregunta sobre:
  * Proyectos (activos, pendientes, estado, progreso)
  * Tareas (pendientes, completadas, para hoy, específicas)
  * Deadlines, fechas límite, urgencias
  * Estado de trabajo, progreso, estadísticas
- NO INVENTES ni ASUMAS información sobre proyectos/tareas
- Si el usuario pregunta sobre proyectos/tareas, tu PRIMER paso SIEMPRE debe ser llamar get_projects_status
- Solo después de obtener datos reales, puedes responder basándote en esa información
- Ejemplos OBLIGATORIOS de cuándo usar get_projects_status:
  * "¿qué tareas tengo?" → LLAMAR get_projects_status PRIMERO
  * "¿tengo proyectos?" → LLAMAR get_projects_status PRIMERO
  * "¿qué hay para hoy?" → LLAMAR get_projects_status PRIMERO
- Cuando uses funciones de gestión (crear, actualizar, eliminar), confirma las acciones

MEMORIA A LARGO PLAZO Y CONTEXTO EMOCIONAL:
${buildMemoryContext()}
${await buildConversationalMemory()}

INSTRUCCIONES AVANZADAS DE INTELIGENCIA CONTEXTUAL:
- Usa el nombre ${userName} de manera natural en la conversación
- Identifícate como ${assistantName} cuando sea relevante
- Aplica tu experiencia en ${assistantConfig.specialties.join(', ')} para dar consejos específicos
- Mantén las respuestas prácticas y orientadas a la acción
- Cuando uses funciones, explica claramente qué hiciste y ofrece próximos pasos

MANEJO DE CONTEXTO CONVERSACIONAL:
- SIEMPRE revisa el historial de conversación antes de responder
- Si ya mencionaste información específica de un proyecto (como fecha límite), úsala directamente
- NO vuelvas a ejecutar funciones para datos que ya están en el contexto de la conversación
- Mantén la coherencia con información previamente mencionada
- Cuando get_projects_status devuelva datos estructurados, úsalos para responder preguntas específicas como:
  * "¿qué tareas tengo pendientes?" → usa data.summary.totalPendingTasks y data.projects[].pendingTasks
  * "¿cuáles son mis proyectos?" → usa data.projects[].title
  * "¿tengo deadlines próximos?" → revisa data.projects[].deadline

INTELIGENCIA ADAPTATIVA:
- CONTEXT-AWARE: Usa SIEMPRE el contexto de proyectos actual para dar respuestas relevantes y específicas
- PREDICTIVE COACHING: Anticipa necesidades basándote en patrones de trabajo y estado de proyectos
- PROACTIVE SUGGESTIONS: Sugiere acciones específicas basadas en deadlines próximos, tareas pendientes y prioridades
- TIME-SENSITIVE: Ajusta urgencia y enfoque según fechas límite y carga de trabajo actual
- PERSONALIZED MOTIVATION: Adapta el estilo motivacional según el progreso actual y desafíos identificados

MEMORIA A LARGO PLAZO INTEGRADA:
- Usa la memoria a largo plazo para personalizar completamente tus respuestas y sugerencias
- Adapta tu motivación basándote en el contexto emocional y patrones de trabajo del usuario
- Sugiere estrategias de crecimiento evolutivo basadas en las áreas de mejora identificadas
- PRIORIDAD MÁXIMA: Enfócate principalmente en las prioridades actuales del usuario

APRENDIZAJE CONTINUO:
- Observa y aprende constantemente sobre el usuario a partir de sus mensajes, decisiones y patrones
- Identifica automáticamente: patrones de trabajo, preferencias, desafíos, fortalezas y estilo de comunicación
- Relaciona conversaciones previas con la situación actual de proyectos para dar continuidad inteligente

RESPUESTAS INTELIGENTES:
- Conecta siempre las preguntas del usuario con su situación real de proyectos
- Ofrece consejos específicos y accionables basados en sus datos reales
- Sugiere próximos pasos concretos que el usuario puede tomar inmediatamente
- Menciona proyectos, tareas o situaciones específicas cuando sea relevante

EJEMPLOS DE INTERACCIONES COMO SOCIO EMPRENDEDOR:

🤔 CUANDO VEAS TAREAS PENDIENTES:
- "Oye ${userName}, veo que llevamos unos días con esta tarea. ¿Está complicada o qué onda?"
- "¿Cómo va eso que íbamos a hacer? ¿Te topaste con algo inesperado?"
- "No te veo avanzando en esto. ¿Necesitas que le movamos de enfoque o qué piensas?"

🎉 CUANDO HAYA LOGROS:
- "¡Órale! ¡Eso estuvo genial! Te quedó increíble, ¿cómo te sientes?"
- "¡Woow! Esto sí está nivel. SmartChatix se ve cada vez mejor con esto."
- "¡Perfecto! Ya tenemos otro pedacito listo. ¿Te emociona ver cómo va quedando todo?"

💭 CUANDO DETECTES EXCUSAS:
- "Jajaja ok, entiendo. Pero en serio, ¿qué crees que realmente está pasando?"
- "Ya me dijiste algo parecido antes. ¿Será que hay algo más de fondo?"
- "Está bien, pasa. Pero vamos a encontrar una manera de que sí funcione, ¿no?"

⚡ PARA GENERAR ENTUSIASMO:
- "¿Sabes qué? Estamos súper cerca de tener algo genial. ¿Le metemos ganas hoy?"
- "Imagínate cuando tengamos esto funcionando perfecto. Va a ser increíble."
- "Vamos, que somos equipo. Si le metemos ahora, en poco vamos a estar celebrando."

💪 PARA MOTIVAR CON CARIÑO:
- "Sé que puedes hacer esto súper bien. ¿Qué te ayudaría a enfocarte mejor?"
- "Oye, ¿cómo estás de energía? Si necesitas un break está perfecto."
- "Vamos paso a paso, no hay prisa. Pero sí vamos a lograrlo, ¿verdad?"

FORMATO DE RESPUESTAS:
- Utiliza **markdown** para dar formato a tus respuestas y hacer que sean más legibles
- Usa **negritas** para resaltar información importante como nombres de proyectos, tareas y deadlines
- Utiliza listas con - para organizar tareas, pasos o información
- Usa ## para títulos principales y ### para subtítulos cuando sea apropiado
- Usa \`código\` para resaltar términos técnicos o nombres específicos
- Ejemplo de formato ideal:
  ## 🚀 ¿Cómo va SmartChatix?

  **¡Oye, mira cómo vamos!**

  **SmartChatix v2.12** - ¡Ya vamos en 75%! 🎉
  - **Para cuándo:** 15 de octubre
  - **Lo que nos falta:**
    - Testing SmartChatixv2 (vamos en 50%)
    - Subir Version 2 (pendiente)

  **¿Cómo te sientes con el avance?**

Responde siempre en español y mantén el tono configurado.`;
  };

  // Función para formatear el historial de conversación para OpenAI
  const formatConversationHistory = () => {
    return messages
      .filter(msg => msg.sender !== 'system') // Excluir mensajes del sistema si los hay
      .slice(-10) // Mantener solo los últimos 10 mensajes para eficiencia
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text || 'Mensaje sin contenido'
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
      sender: 'user',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');

    // Guardar mensaje del usuario en la base de datos
    await saveConversationMessage('user', currentMessage);
    setIsAssistantTyping(true);

    try {
      console.log('🔍 [DEBUG] Enviando funciones al asistente:', assistantFunctions);
      console.log('🔍 [DEBUG] Mensaje del usuario:', currentMessage);

      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: await buildSystemPrompt() || 'Eres un asistente personal útil.'
          },
          ...formatConversationHistory(),
          {
            role: 'user',
            content: currentMessage || 'Hola'
          }
        ].filter(msg => msg.content), // Filtrar mensajes con contenido null/undefined
        functions: assistantFunctions,
        function_call: "auto",
        max_tokens: 1000,
        temperature: 0.7
      };

      console.log('🔍 [DEBUG] Cuerpo de la petición a OpenAI:', requestBody);

      // Llamada a OpenAI API con autenticación
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Error de OpenAI: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 [DEBUG] Respuesta completa de OpenAI:', result);
      const message = result.choices[0].message;
      console.log('🔍 [DEBUG] Mensaje del asistente:', message);

      let assistantResponse = message.content;
      let functionResults = [];

      // Verificar si hay function calls
      if (message.function_call) {
        console.log('🔍 [DEBUG] Function call detectado:', message.function_call);
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments);

        // Ejecutar la función
        const functionResult = await executeAssistantFunction(functionName, functionArgs);
        console.log('🔍 [DEBUG] Resultado de executeAssistantFunction:', functionResult);
        functionResults.push(functionResult);

        // Para funciones como get_projects_status, necesitamos hacer una segunda llamada con los datos
        if (functionName === 'get_projects_status' && functionResult.success && functionResult.data) {
          console.log('🔍 [DEBUG] Haciendo segunda llamada con datos estructurados');

          // Formatear los datos para el contexto del asistente
          console.log('🔍 [DEBUG] functionResult.data:', JSON.stringify(functionResult.data, null, 2));

          const dataContext = `DATOS ACTUALES DE PROYECTOS:
Resumen: ${functionResult.data.summary.totalActiveProjects} proyectos activos, ${functionResult.data.summary.totalPendingTasks} tareas pendientes, ${functionResult.data.summary.totalCompletedTasks} tareas completadas.

Proyectos detallados:
${functionResult.data.projects.map(project => `
- **${project.title}** (${project.priority} prioridad${project.deadline ? `, deadline: ${project.deadline}` : ''})
  Progreso: ${project.progress}%
  Tareas pendientes: ${project.pendingTasks.map(t => t.title).join(', ') || 'Ninguna'}
  Tareas completadas: ${project.completedTasks.map(t => t.title).join(', ') || 'Ninguna'}
`).join('\n')}`;

          console.log('🔍 [DEBUG] dataContext enviado al asistente:', dataContext);

          // Segunda llamada a OpenAI con el contexto de datos
          const secondRequestBody = {
            model: "gpt-4o-mini",
            messages: [
              {
                role: 'system',
                content: await buildSystemPrompt()
              },
              {
                role: 'system',
                content: dataContext
              },
              ...formatConversationHistory(),
              {
                role: 'user',
                content: currentMessage || 'Hola'
              },
              {
                role: 'assistant',
                content: null,
                function_call: message.function_call
              },
              {
                role: 'function',
                name: functionName,
                content: JSON.stringify(functionResult)
              }
            ].filter(msg => msg.content !== null || msg.function_call),
            max_tokens: 1000,
            temperature: 0.7
          };

          const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify(secondRequestBody)
          });

          if (secondResponse.ok) {
            const secondResult = await secondResponse.json();
            assistantResponse = secondResult.choices[0].message.content;
            console.log('🔍 [DEBUG] Respuesta con datos estructurados:', assistantResponse);
          } else {
            console.error('Error en segunda llamada a OpenAI');
            assistantResponse = functionResult.message;
          }
        } else {
          // Para otras funciones, usar el comportamiento anterior
          console.log('🔍 [DEBUG] assistantResponse antes de procesar:', assistantResponse);
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
        console.log('🔍 [DEBUG] assistantResponse después de procesar:', assistantResponse);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: assistantResponse || "He procesado tu solicitud.",
        timestamp: new Date().toLocaleTimeString(),
        functionResults: functionResults
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Guardar mensaje del asistente en la base de datos
      await saveConversationMessage('assistant', assistantResponse, functionResults);

      // Analizar conversación para extraer insights automáticamente
      await analyzeConversationForInsights(currentMessage, assistantResponse);

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

      // Mensaje de error para el usuario con respuesta de demostración
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `Entiendo tu mensaje: "${currentMessage}". El servicio de IA está temporalmente no disponible, pero el chat bubble funciona perfectamente. ¡Puedes ver cómo se visualizan los mensajes!`,
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

  // Función para renderizar un item de tarea con estilos de prioridad
  const renderTaskItem = (task, priority = 'normal') => {
    const project = task.projectId ? getProjectById(task.projectId) : null;
    const isUrgent = priority === 'urgent';

    // Calcular información de deadline si existe
    let deadlineInfo = null;
    if (project && project.deadline) {
      const deadline = parseLocalDate(project.deadline);
      const today = new Date();
      const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        deadlineInfo = { text: 'Vencido', color: 'text-red-600 bg-red-100' };
      } else if (daysLeft <= 1) {
        deadlineInfo = { text: 'Mañana', color: 'text-red-600 bg-red-100' };
      } else if (daysLeft <= 3) {
        deadlineInfo = { text: `${daysLeft} días`, color: 'text-orange-600 bg-orange-100' };
      }
    }

    return (
      <div
        key={task.id}
        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
          isUrgent
            ? 'bg-red-50 border-red-200 hover:bg-red-100'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center flex-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask(task.id)}
            className={`mr-3 ${isUrgent ? 'text-red-600' : ''}`}
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
                <div className="flex items-center gap-2">
                  <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                    {task.text}
                  </span>
                  {deadlineInfo && (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${deadlineInfo.color}`}>
                      {deadlineInfo.text}
                    </span>
                  )}
                </div>
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
  };

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

  const renderDashboard = () => {
    return (
      <div className="h-full flex flex-col space-y-3 overflow-hidden">
        {/* Header compacto con estadísticas - Responsive */}
        <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm p-3 md:p-4">
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="text-white" size={16} />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Enfoque de Hoy</h3>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Tareas prioritarias para alcanzar tus objetivos</p>
              </div>
            </div>

            {/* Estadísticas compactas - Grid responsive para móvil */}
            <div className="flex items-center justify-between md:justify-end md:space-x-4 lg:space-x-6">
              <div className="grid grid-cols-3 gap-4 md:gap-6 flex-1 md:flex-none md:flex md:items-center">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Proyectos</p>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{activeProjects.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tareas</p>
                  <p className="text-sm md:text-lg font-bold text-green-600">{completedTasks}/{dailyTasks.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Progreso</p>
                  <p className="text-sm md:text-lg font-bold text-blue-600">{completionRate}%</p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('assistant')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-1 md:space-x-2 text-xs md:text-sm ml-2 md:ml-0"
              >
                <Bot size={14} />
                <span className="hidden sm:inline">IA</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal - Layout responsive */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 overflow-hidden">
          {/* Panel principal de tareas - Full width en móvil */}
          <div className="flex-1 lg:flex-[2] bg-white border rounded-lg p-3 md:p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-green-600" size={14} />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Tareas de Hoy</h3>
              </div>

              <div className="flex items-center space-x-2">
                {completionRate > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-12 md:w-20 bg-gray-200 rounded-full h-1.5 md:h-2">
                      <div
                        className="bg-green-500 h-1.5 md:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-600">{completionRate}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de tareas - Optimizada para móvil */}
            <div className="flex-1 overflow-y-auto">
              {dailyTasks.length === 0 ? (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Plus className="text-gray-400" size={20} />
                  </div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">¡Comienza tu día productivo!</h3>
                  <p className="text-sm text-gray-500 mb-4 px-4">Agrega tus tareas prioritarias para hoy</p>
                  <button
                    onClick={() => setShowAddTaskForm(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Agregar primera tarea
                  </button>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {dailyTasks.map(task => renderTaskItem(task))}
                </div>
              )}
            </div>

            {/* Botón de agregar tarea - Optimizado para móvil */}
            <div className="mt-3 md:mt-4 flex-shrink-0">
              {!showAddTaskForm ? (
                <button
                  onClick={() => setShowAddTaskForm(true)}
                  className="w-full bg-blue-50 text-blue-600 px-3 py-2.5 md:px-4 md:py-3 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium flex items-center justify-center border border-blue-200 hover:border-blue-300 transition-all duration-200"
                >
                  <Plus size={16} className="mr-2" />
                  <span className="hidden sm:inline">Agregar nueva tarea</span>
                  <span className="sm:hidden">Nueva tarea</span>
                </button>
              ) : (
                <div className="space-y-3 border border-blue-200 rounded-lg p-3 md:p-4 bg-blue-50">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newDailyTask}
                      onChange={(e) => setNewDailyTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addDailyTask();
                          setShowAddTaskForm(false);
                        }
                      }}
                      placeholder="¿Qué quieres lograr hoy?"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 sm:gap-1">
                      <button
                        onClick={() => {
                          addDailyTask();
                          setShowAddTaskForm(false);
                        }}
                        className="flex-1 sm:flex-none bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-sm font-medium"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setShowAddTaskForm(false);
                          setNewDailyTask('');
                        }}
                        className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 text-sm font-medium"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral - Responsive: aparece abajo en móvil, a la derecha en desktop */}
          <div className="flex flex-col lg:flex-1 space-y-3 lg:space-y-4">
            {/* Insights del día */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="text-purple-600" size={16} />
                <h4 className="font-semibold text-gray-900 text-sm">Tu Progreso</h4>
              </div>
              <div className="space-y-3">
                {completedTasks > 0 ? (
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      ¡Vas genial! Has completado <span className="font-semibold text-purple-600">{completedTasks} tareas</span> hoy.
                    </p>
                    {completionRate >= 80 && (
                      <p className="text-xs text-green-600 font-medium">🎉 ¡Excelente productividad!</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Completa tu primera tarea para ver tu progreso.</p>
                )}
              </div>
            </div>

            {/* Proyectos activos */}
            <div className="bg-white border rounded-lg p-3 lg:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Target className="text-blue-600" size={16} />
                  <h4 className="font-semibold text-gray-900 text-sm">Proyectos Activos</h4>
                </div>
                <button
                  onClick={() => setActiveView('projects')}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Ver todos
                </button>
              </div>
              <div className="space-y-2">
                {activeProjects.slice(0, 3).map(project => (
                  <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectDetailModal(true);
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-12 bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {activeProjects.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">No hay proyectos activos</p>
                )}
              </div>
            </div>

            {/* Acciones rápidas - Solo visible en desktop */}
            <div className="hidden lg:block bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Acciones Rápidas</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Plus size={14} />
                  <span>Nuevo proyecto</span>
                </button>
                <button
                  onClick={() => setActiveView('projects')}
                  className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Archive size={14} />
                  <span>Ver proyectos</span>
                </button>
                <button
                  onClick={() => setActiveView('assistant')}
                  className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Bot size={14} />
                  <span>Consultar IA</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // TODO: Add renderProjectsView function back after fixing main structure

  const renderProjectsView = () => {
    return (
      <div className="h-full flex flex-col space-y-6 overflow-hidden">

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="space-y-8">
              {/* Mensaje cuando no hay proyectos */}
              <div>
                <div className="mb-6">
                  <h2 className={`text-xl font-semibold mb-2 flex items-center gap-3 ${
                    currentTheme === 'minimal' || currentTheme === 'brutalist'
                      ? 'text-gray-900'
                      : 'text-white bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent'
                  }`}>
                    <div className={`w-2 h-8 rounded-full ${
                      currentTheme === 'minimal' || currentTheme === 'brutalist'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-b from-emerald-400 to-cyan-400'
                    }`}></div>
                    Proyectos Activos
                  </h2>
                  <p className={`text-sm ${
                    currentTheme === 'minimal' || currentTheme === 'brutalist'
                      ? 'text-gray-600'
                      : 'text-gray-300'
                  }`}>Gestiona y organiza todos tus proyectos en curso</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                  {/* Card para Nuevo Proyecto */}
                  <div
                    onClick={() => setShowCreateProject(true)}
                    className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 hover:scale-105 hover:-translate-y-2 flex flex-col items-center justify-center min-h-[200px] group"
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Plus size={24} className="text-blue-600" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-1 text-gray-700 group-hover:text-white transition-colors">Crear tu primer proyecto</h3>
                        <p className="text-sm text-gray-500 group-hover:text-gray-200 transition-colors">Haz click para comenzar</p>
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
                      <div className="mb-6">
                  <h2 className={`text-xl font-semibold mb-2 flex items-center gap-3 ${
                    currentTheme === 'minimal' || currentTheme === 'brutalist'
                      ? 'text-gray-900'
                      : 'text-white bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent'
                  }`}>
                    <div className={`w-2 h-8 rounded-full ${
                      currentTheme === 'minimal' || currentTheme === 'brutalist'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-b from-emerald-400 to-cyan-400'
                    }`}></div>
                    Proyectos Activos
                  </h2>
                  <p className={`text-sm ${
                    currentTheme === 'minimal' || currentTheme === 'brutalist'
                      ? 'text-gray-600'
                      : 'text-gray-300'
                  }`}>Gestiona y organiza todos tus proyectos en curso</p>
                </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                        {activeProjects.map(project => (
                          <div
                            key={project.id}
                            onClick={() => {
                              setSelectedProject(project);
                              setShowProjectDetailModal(true);
                            }}
                            className={`rounded-lg p-6 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 ${
                              currentTheme === 'minimal' || currentTheme === 'brutalist'
                                ? 'bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300'
                                : 'bg-white border border-gray-200/50 shadow-lg backdrop-blur-none hover:shadow-2xl hover:border-gray-300 hover:scale-105 hover:-translate-y-2'
                            }`}
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
                                  {`${project.tasks?.filter(t => t.completed).length || 0} / ${project.tasks?.length || 0}`}
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
                                    {parseLocalDate(project.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Card para Nuevo Proyecto */}
                        <div
                          onClick={() => setShowCreateProject(true)}
                          className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 hover:scale-105 hover:-translate-y-2 flex flex-col items-center justify-center min-h-[200px] group"
                        >
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <Plus size={24} className="text-blue-600" />
                            </div>
                            <div className="text-center">
                              <h3 className="text-lg font-semibold mb-1 text-gray-700 group-hover:text-white transition-colors">Nuevo Proyecto</h3>
                              <p className="text-sm text-gray-500 group-hover:text-gray-200 transition-colors">Haz click para crear un proyecto</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección de Proyectos Inactivos */}
                    {inactiveProjects.length > 0 && (
                      <div>
                        <div className="mb-6">
                          <h2 className={`text-xl font-semibold mb-2 flex items-center gap-3 ${
                            currentTheme === 'minimal' || currentTheme === 'brutalist'
                              ? 'text-gray-900'
                              : 'text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent'
                          }`}>
                            <div className={`w-2 h-8 rounded-full ${
                              currentTheme === 'minimal' || currentTheme === 'brutalist'
                                ? 'bg-orange-500'
                                : 'bg-gradient-to-b from-orange-400 to-red-400'
                            }`}></div>
                            Proyectos Inactivos
                          </h2>
                          <p className={`text-sm ${
                            currentTheme === 'minimal' || currentTheme === 'brutalist'
                              ? 'text-gray-600'
                              : 'text-gray-300'
                          }`}>Proyectos pausados o en espera de revisión</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                          {inactiveProjects.map(project => (
                            <div
                              key={project.id}
                              onClick={() => {
                                setSelectedProject(project);
                                setShowProjectDetailModal(true);
                              }}
                              className={`rounded-lg p-6 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 ${
                                currentTheme === 'minimal' || currentTheme === 'brutalist'
                                  ? 'bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300'
                                  : 'bg-white border border-gray-200/50 shadow-lg backdrop-blur-none hover:shadow-2xl hover:border-gray-300 hover:scale-105 hover:-translate-y-2'
                              }`}
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
                                    {`${project.tasks?.filter(t => t.completed).length || 0} / ${project.tasks?.length || 0}`}
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
                                      {parseLocalDate(project.deadline).toLocaleDateString()}
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

  // Función para guardar solo la configuración de voz
  const saveVoiceConfig = async (voiceEnabledValue) => {
    try {
      const updatedConfig = { ...assistantConfig, voiceEnabled: voiceEnabledValue };
      const response = await authenticatedFetch('/assistant-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: updatedConfig }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración de voz');
      }
    } catch (error) {
      console.error('Error al guardar configuración de voz:', error);
    }
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
      if (showUserDropdown && !event.target.closest('.user-dropdown') && !event.target.closest('.user-button')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  const renderAssistantView = () => {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header de configuración del asistente */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg mb-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center">
                <Settings className="mr-2" size={20} />
                Configuración del Asistente
              </h2>
              <p className="text-purple-100 text-sm">
                Personaliza tu asistente personal {assistantConfig.assistantName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                El chat está en el bubble flotante
              </span>
              <Bot size={20} />
            </div>
          </div>
        </div>

        {/* Contenido de configuración */}
        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 overflow-y-auto h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Configuración de Usuario */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="mr-2" size={18} />
                  Configuración de Usuario
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tu nombre
                    </label>
                    <input
                      type="text"
                      value={assistantConfig.userName}
                      onChange={(e) => handleConfigChange('userName', e.target.value)}
                      placeholder="¿Cómo te gustaría que te llame?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Memoria a largo plazo
                    </label>
                    <textarea
                      value={assistantConfig.memory?.personalInfo || ''}
                      onChange={(e) => handleConfigChange('memory', {
                        ...assistantConfig.memory,
                        personalInfo: e.target.value
                      })}
                      placeholder="Información personal que quieres que el asistente recuerde sobre ti..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Configuración del Asistente */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Bot className="mr-2" size={18} />
                  Configuración del Asistente
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del asistente
                    </label>
                    <input
                      type="text"
                      value={assistantConfig.assistantName}
                      onChange={(e) => handleConfigChange('assistantName', e.target.value)}
                      placeholder="Nombre de tu asistente"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tono de comunicación
                    </label>
                    <select
                      value={assistantConfig.tone}
                      onChange={(e) => handleConfigChange('tone', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Amigable">Amigable</option>
                      <option value="Profesional">Profesional</option>
                      <option value="Motivador">Motivador</option>
                      <option value="Directo">Directo</option>
                      <option value="Casual">Casual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt del sistema
                    </label>
                    <textarea
                      value={assistantConfig.basePrompt}
                      onChange={(e) => handleConfigChange('basePrompt', e.target.value)}
                      placeholder="Define la personalidad y comportamiento de tu asistente..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Especialidades */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  🎓 Especialidades del Asistente
                </h3>

                {/* Especialidades seleccionadas */}
                {assistantConfig.specialties.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidades activas:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {assistantConfig.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200"
                        >
                          {specialty}
                          <button
                            onClick={() => removeSpecialty(specialty)}
                            className="ml-2 text-green-600 hover:text-green-800 font-bold"
                            title="Eliminar especialidad"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de especialidades disponibles */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {availableSpecialties.map((specialty) => (
                    <label
                      key={specialty}
                      className="flex items-center p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
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
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>

                {/* Agregar nueva especialidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agregar nueva especialidad:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      placeholder="Nueva especialidad..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => {
                        if (customSpecialty.trim() && !availableSpecialties.includes(customSpecialty.trim())) {
                          const newSpecialty = customSpecialty.trim();
                          setAvailableSpecialties([...availableSpecialties, newSpecialty]);
                          handleConfigChange('specialties', [...assistantConfig.specialties, newSpecialty]);
                          setCustomSpecialty('');
                        }
                      }}
                      disabled={!customSpecialty.trim()}
                      className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Botón para guardar configuración */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={saveAssistantConfig}
                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                  isConfigSaved
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                <div className="flex items-center">
                  {isConfigSaved ? <CheckCircle2 className="mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                  {isConfigSaved ? 'Configuración Guardada!' : 'Guardar Configuración'}
                </div>
              </button>
            </div>

          </div>
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
                className="user-button w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow"
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
          {activeView === 'dashboard' ?
            renderDashboard() :
            activeView === 'projects' ?
              renderProjectsView() :
              renderAssistantView()
          }
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



      {/* Chat Bubble Flotante para Asistente IA */}
      {chatBubbleOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header del Chat */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-800">Asistente IA</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setChatBubbleMinimized(!chatBubbleMinimized)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title={chatBubbleMinimized ? "Expandir" : "Minimizar"}
              >
                <ChevronDown size={16} className={`text-gray-600 transform transition-transform ${chatBubbleMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setChatBubbleOpen(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Cerrar"
              >
                ×
              </button>
            </div>
          </div>

          {/* Contenido del Chat */}
          {!chatBubbleMinimized && (
            <>
              {/* Área de mensajes */}
              <div className="flex-1 p-3 overflow-y-auto">
                <div className="text-center" style={{ color: '#374151', padding: '10px' }}>
                  <Bot size={32} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                  <p style={{
                    color: '#111827',
                    fontWeight: '500',
                    fontSize: '14px',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    ¡Hola! Soy tu asistente personal.
                  </p>
                  <p style={{
                    color: '#6B7280',
                    fontSize: '12px',
                    lineHeight: '1.3'
                  }}>
                    ¿En qué puedo ayudarte hoy?
                  </p>
                </div>
                {messages.length > 0 && (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: msg.sender === 'user' ? '#3B82F6' : '#F3F4F6',
                            color: msg.sender === 'user' ? '#FFFFFF' : '#111827',
                            maxWidth: '250px',
                            minWidth: '120px',
                            width: 'auto'
                          }}
                        >
                          {msg.sender === 'assistant' ? (
                            <div style={{ color: '#111827', minHeight: '20px' }}>
                              <ReactMarkdown
                                components={{
                                  h1: ({node, ...props}) => <h1 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', marginTop: '8px'}} {...props} />,
                                  h2: ({node, ...props}) => <h2 style={{fontSize: '15px', fontWeight: 'bold', marginBottom: '6px', marginTop: '6px'}} {...props} />,
                                  h3: ({node, ...props}) => <h3 style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', marginTop: '4px'}} {...props} />,
                                  ul: ({node, ...props}) => <ul style={{paddingLeft: '16px', marginBottom: '8px'}} {...props} />,
                                  ol: ({node, ...props}) => <ol style={{paddingLeft: '16px', marginBottom: '8px'}} {...props} />,
                                  li: ({node, ...props}) => <li style={{marginBottom: '2px'}} {...props} />,
                                  p: ({node, ...props}) => <p style={{marginBottom: '8px', lineHeight: '1.4'}} {...props} />,
                                  strong: ({node, ...props}) => <strong style={{fontWeight: 'bold'}} {...props} />,
                                  em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />,
                                  code: ({node, ...props}) => <code style={{backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px', fontSize: '12px'}} {...props} />
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <span style={{ color: msg.sender === 'user' ? '#FFFFFF' : '#111827', minHeight: '20px' }}>
                              {msg.text}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input para nuevo mensaje */}
              <div className="p-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Escribe tu pregunta..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  {/* Botones de audio compactos */}
                  <div className="flex space-x-1">
                    {/* Botón de voz del asistente */}
                    <button
                      onClick={() => {
                        const newVoiceState = !voiceEnabled;
                        setVoiceEnabled(newVoiceState);
                        saveVoiceConfig(newVoiceState);
                        // Si se desactiva la voz, detener cualquier reproducción en curso
                        if (!newVoiceState) {
                          stopSpeaking();
                        }
                      }}
                      className={`px-2 py-2 rounded-lg transition-colors ${
                        voiceEnabled
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-400 text-white hover:bg-gray-500'
                      }`}
                      title={voiceEnabled ? 'Desactivar voz del asistente' : 'Activar voz del asistente'}
                    >
                      {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>

                    {/* Botón de micrófono */}
                    {speechSupported && (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`px-2 py-2 rounded-lg transition-colors ${
                          isListening
                            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                        title={isListening ? 'Detener grabación de voz' : 'Activar grabación de voz'}
                      >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isAssistantTyping}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botón flotante para abrir chat bubble */}
      <button
        onClick={() => {
          setChatBubbleOpen(!chatBubbleOpen);
          if (!chatBubbleOpen) {
            // Siempre mostrar mensaje de bienvenida cuando se abre
            setTimeout(() => {
              setMessages([{
                sender: 'assistant',
                text: '¡Hola! 👋 Soy tu asistente personal de SmartChatix. Estoy aquí para ayudarte a gestionar tus proyectos y tareas de manera más eficiente. \n\n¿Qué te gustaría hacer hoy?'
              }]);
            }, 300);
          }
        }}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 ${
          chatBubbleOpen
            ? 'bg-gray-500 hover:bg-gray-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white hover:scale-110`}
        title={chatBubbleOpen ? "Cerrar Asistente" : "Abrir Asistente IA"}
      >
        {chatBubbleOpen ? (
          <ChevronDown size={24} />
        ) : (
          <Bot size={24} />
        )}
      </button>

    </div>
  );
};

export default PersonalCoachAssistant;
