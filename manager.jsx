import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckCircle, Calendar, Target, TrendingUp, Settings, Archive, Play, Pause, Trash2, Edit3, Bot, User, MessageCircle, Send, Save, CheckCircle2, Mic, MicOff, Volume2, VolumeX, LogOut, Eye, EyeOff, ChevronDown, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Auth from './src/components/Auth';
import useAuth from './src/hooks/useAuth';
import { getPromptConfig } from './src/config/promptConfig';

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
    border-bottom: 2px solid #ff00ff;
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

    return '/api';
  }

  // En desarrollo - usar variable de entorno si está disponible
  const devHost = import.meta.env.VITE_DEV_SERVER_HOST || 'localhost';
  console.log('🔧 Manager modo desarrollo detectado, usando:', devHost);
  return `http://${devHost}:3001/api`;
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

  // console.log('Auth state:', { user, authLoading, isAuthenticated });

  const [projects, setProjects] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', priority: 'media', deadline: '', description: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [newDailyTask, setNewDailyTask] = useState('');
  const [selectedProjectForTask, setSelectedProjectForTask] = useState('');
  const [selectedProjectTasks, setSelectedProjectTasks] = useState([]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [addTaskStep, setAddTaskStep] = useState(1); // 1: seleccionar proyecto, 2: seleccionar tarea o crear nueva
  const [selectedProjectTaskId, setSelectedProjectTaskId] = useState('');
  const [addTaskMode, setAddTaskMode] = useState(''); // 'existing' o 'new'
  const [showProjectSelectionModal, setShowProjectSelectionModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: seleccionar proyecto, 2: tareas/crear nueva
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);
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
  const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editEstimatedHours, setEditEstimatedHours] = useState('');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState('');
  const [editActualHours, setEditActualHours] = useState('');
  const [editActualMinutes, setEditActualMinutes] = useState('');
  const [editTaskProject, setEditTaskProject] = useState(''); // Para vincular tareas diarias con proyectos
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [activeTimers, setActiveTimers] = useState(() => {
    const saved = localStorage.getItem('activeTimers');
    return saved ? JSON.parse(saved) : {};
  }); // {taskId: startTime}
  const [timerIntervals, setTimerIntervals] = useState({}); // {taskId: intervalId}
  const [pausedTimers, setPausedTimers] = useState(() => {
    const saved = localStorage.getItem('pausedTimers');
    return saved ? JSON.parse(saved) : {};
  }); // {taskId: accumulatedTime}
  const [timerMode, setTimerMode] = useState(() => {
    const saved = localStorage.getItem('timerMode');
    return saved || 'una_tarea'; // 'una_tarea' o 'multiples'
  });
  const [timerTick, setTimerTick] = useState(0); // Para forzar re-renders del timer
  const globalTimerRef = useRef(null); // Referencia para el timer global

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
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceSpeed, setVoiceSpeed] = useState(1.1);
  const [availableVoices, setAvailableVoices] = useState([]);

  // Detectar si está en móvil
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Función para cargar y mostrar voces disponibles
  const loadAvailableVoices = () => {
    if (synthesisRef.current) {
      const voices = synthesisRef.current.getVoices();
      const spanishVoices = voices.filter(voice =>
        voice.lang.startsWith('es-') || voice.lang.startsWith('es_')
      );

      const voiceDetails = spanishVoices.map(voice => ({
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
        default: voice.default,
        quality: voice.name.toLowerCase().includes('neural') ||
                voice.name.toLowerCase().includes('premium') ||
                voice.name.toLowerCase().includes('enhanced') ? 'Premium' : 'Básica'
      }));

      console.log('🎤 Voces en español disponibles:', voiceDetails);

      // Sugerir mejoras según la plataforma
      const premiumVoices = voiceDetails.filter(v => v.quality === 'Premium');
      const mobile = isMobile();

      if (premiumVoices.length === 0) {
        console.log('💡 Para mejorar la calidad de voz:');
        if (mobile) {
          console.log('📱 Móvil detectado:');
          console.log('   Android: Configuración > Idioma > Síntesis de voz > Instalar voces');
          console.log('   iOS: Las voces de alta calidad se descargan automáticamente');
        } else {
          console.log('🖥️ Escritorio:');
          console.log('   Windows: Configuración > Hora e idioma > Voz > Agregar voces');
          console.log('   macOS: Preferencias > Accesibilidad > Contenido hablado');
          console.log('   Linux: sudo apt install espeak-ng-data-* (para más voces)');
        }
      } else {
        console.log(`✅ ${premiumVoices.length} voz(es) de calidad premium detectadas`);
      }

      setAvailableVoices(spanishVoices);

      // Seleccionar automáticamente la mejor voz disponible si no hay una seleccionada
      if (!selectedVoice && spanishVoices.length > 0) {
        const preferredVoice = spanishVoices.find(voice =>
          voice.name.toLowerCase().includes('neural') ||
          voice.name.toLowerCase().includes('premium') ||
          voice.name.toLowerCase().includes('enhanced') ||
          voice.name.toLowerCase().includes('natural') ||
          voice.name.toLowerCase().includes('microsoft') ||
          voice.name.toLowerCase().includes('google')
        ) || spanishVoices[0];

        setSelectedVoice(preferredVoice);
      }
    }
  };
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
      const response = await authenticatedFetch(`${getApiBase()}/auth/profile`);
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
      // Cargar voces disponibles para selección
      setTimeout(loadAvailableVoices, 1000);
      // También cargar cuando cambien las voces del sistema
      if (synthesisRef.current) {
        synthesisRef.current.onvoiceschanged = loadAvailableVoices;
      }
    }
  }, [isAuthenticated, user]); // Removed loadUserData from dependencies to prevent infinite loop

  // Recalcular progreso cuando cambien las tareas de los proyectos
  // Removed problematic useEffect that was causing infinite loops
  // Progress calculation is now handled directly in task operations

  // Scroll automático al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar configuración de voz desde localStorage
  useEffect(() => {
    try {
      const savedVoiceConfig = localStorage.getItem('voiceConfig');
      if (savedVoiceConfig) {
        const config = JSON.parse(savedVoiceConfig);
        setVoiceEnabled(config.voiceEnabled || false);
        setVoiceSpeed(config.voiceSpeed || 1.1);

        // Cargar la voz seleccionada si existe
        if (config.selectedVoice && availableVoices.length > 0) {
          const voice = availableVoices.find(v => v.name === config.selectedVoice.name);
          if (voice) {
            setSelectedVoice(voice);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de voz:', error);
    }
  }, [availableVoices]); // Se ejecuta cuando las voces están disponibles

  // Efectos para persistencia de timers
  useEffect(() => {
    localStorage.setItem('activeTimers', JSON.stringify(activeTimers));
  }, [activeTimers]);

  useEffect(() => {
    localStorage.setItem('pausedTimers', JSON.stringify(pausedTimers));
  }, [pausedTimers]);

  useEffect(() => {
    localStorage.setItem('timerMode', timerMode);
  }, [timerMode]);

  // Gestión del timer global para evitar re-renders innecesarios
  const startGlobalTimer = () => {
    if (!globalTimerRef.current) {
      globalTimerRef.current = setInterval(() => {
        setTimerTick(prev => prev + 1);
      }, 1000);
    }
  };

  const stopGlobalTimer = () => {
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
      globalTimerRef.current = null;
    }
  };

  // Gestionar timer global basado en timers activos
  useEffect(() => {
    const hasActiveTimers = Object.keys(activeTimers).length > 0;
    if (hasActiveTimers) {
      startGlobalTimer();
    } else {
      stopGlobalTimer();
    }

    return () => stopGlobalTimer();
  }, [activeTimers]);

  // Ya no necesitamos timers individuales - se maneja con el timer global

  // Inicializar soporte de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Configuración específica para móvil vs desktop
      const mobile = isMobile();
      recognitionRef.current.continuous = !mobile; // En móvil, no usar continuous
      recognitionRef.current.interimResults = !mobile; // En móvil, solo resultados finales
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
        const mobile = isMobile();
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else if (!mobile) { // Solo usar interim en desktop
            interimTranscript += result[0].transcript;
          }
        }

        if (mobile) {
          // En móvil: solo usar resultados finales y no acumular
          if (finalTranscript) {
            const cleanedText = finalTranscript.trim();
            finalTranscriptRef.current = cleanedText; // No acumular, reemplazar
            setNewMessage(cleanedText);
          }
        } else {
          // En desktop: comportamiento original
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript + ' ';
          }

          const fullText = (finalTranscriptRef.current + interimTranscript).trim();
          setNewMessage(fullText);
        }

        // Resetear timeout para detener grabación después de pausa
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          console.log('Timeout reseteado - nueva actividad detectada');
        }

        // Timeout más corto en móvil
        const timeoutDuration = mobile ? 1500 : 2000;
        timeoutRef.current = setTimeout(() => {
          console.log('Timeout ejecutado - deteniendo reconocimiento');
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (error) {
              console.log('Reconocimiento ya detenido');
            }
          }
        }, timeoutDuration);
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

  // Función para manejar el envío del tiempo real
  const handleTimeSubmit = async (actualHours) => {
    if (!completingTask) return;

    try {
      // Actualizar la tarea con el tiempo real
      const updatedTask = {
        ...completingTask,
        actual_hours: actualHours,
        completed: true
      };

      // Actualizar en el estado local
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === completingTask.projectId
            ? {
                ...project,
                tasks: project.tasks.map(task =>
                  task.id === completingTask.id ? updatedTask : task
                )
              }
            : project
        )
      );

      // Aquí podrías hacer una llamada al backend para guardar el tiempo real
      console.log('Tiempo real guardado:', {
        taskId: completingTask.id,
        estimated: completingTask.estimated_hours,
        actual: actualHours
      });

      // Cerrar modal
      setShowTimeModal(false);
      setCompletingTask(null);

    } catch (error) {
      console.error('Error guardando tiempo real:', error);
    }
  };

  // Funciones para el timer
  const startTimer = (taskId) => {
    const activeTimerIds = Object.keys(activeTimers);

    if (timerMode === 'una_tarea' && activeTimerIds.length > 0) {
      // Una tarea a la vez: pausar automáticamente otros timers
      const currentTask = dailyTasks.find(t => t.id.toString() === activeTimerIds[0]) ||
                         projects.flatMap(p => p.tasks).find(t => t.id.toString() === activeTimerIds[0]);

      const newTask = dailyTasks.find(t => t.id.toString() === taskId) ||
                     projects.flatMap(p => p.tasks).find(t => t.id.toString() === taskId);

      if (confirm(`Tienes una tarea en curso. ¿Pausar "${currentTask?.text || currentTask?.title || 'tarea actual'}" para empezar "${newTask?.text || newTask?.title || 'nueva tarea'}"?`)) {
        activeTimerIds.forEach(id => pauseTimer(id));
      } else {
        return; // No iniciar el nuevo timer
      }
    } else if (timerMode === 'multiples' && activeTimerIds.length > 0) {
      // Múltiples tareas: advertir sobre múltiples timers
      if (!confirm(`Ya tienes ${activeTimerIds.length} tarea(s) corriendo. ¿Quieres agregar otra tarea más?`)) {
        return; // No iniciar el nuevo timer
      }
    }

    // Auto-agregar tarea de proyecto a tareas diarias cuando se inicia el timer
    const projectTask = projects.flatMap(p =>
      p.tasks.map(task => ({ ...task, projectId: p.id, projectTitle: p.title }))
    ).find(t => t.id.toString() === taskId.toString());

    if (projectTask) {
      // Es una tarea de proyecto, agregarla automáticamente a las tareas diarias
      const existingDailyTask = dailyTasks.find(dt =>
        dt.projectId === projectTask.projectId && dt.projectTaskId === projectTask.id
      );

      if (!existingDailyTask) {
        const dailyTask = {
          id: projectTask.id, // Usar el mismo ID de la tarea de proyecto para sincronizar timers
          text: projectTask.title,
          completed: projectTask.completed,
          createdAt: new Date().toLocaleDateString(),
          projectId: projectTask.projectId,
          projectTaskId: projectTask.id
        };
        setDailyTasks(prev => [...prev, dailyTask]);
      }
    }

    const startTime = Date.now();
    setActiveTimers(prev => ({ ...prev, [taskId]: startTime }));

    // El timer global se encarga de los re-renders
  };

  const pauseTimer = (taskId) => {
    const startTime = activeTimers[taskId];
    if (startTime) {
      const elapsed = Date.now() - startTime;
      const previousTime = pausedTimers[taskId] || 0;

      // Guardar tiempo acumulado
      setPausedTimers(prev => ({
        ...prev,
        [taskId]: previousTime + elapsed
      }));

      // Limpiar timer activo
      setActiveTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[taskId];
        return newTimers;
      });
    }
  };

  const resumeTimer = (taskId) => {
    // Continuar desde donde se pausó
    startTimer(taskId);
  };

  const completeTask = (taskId) => {
    // Calcular tiempo total
    let totalTime = pausedTimers[taskId] || 0;

    if (activeTimers[taskId]) {
      const elapsed = Date.now() - activeTimers[taskId];
      totalTime += elapsed;
    }

    const durationHours = totalTime / (1000 * 60 * 60);

    // Limpiar timer activo
    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[taskId];
      return newTimers;
    });

    setPausedTimers(prev => {
      const newPaused = { ...prev };
      delete newPaused[taskId];
      return newPaused;
    });

    return durationHours;
  };

  const stopTimer = (taskId) => {
    // Mantener función original para compatibilidad
    return completeTask(taskId);
  };

  const getTimerDisplay = (taskId) => {
    const startTime = activeTimers[taskId];
    const pausedTime = pausedTimers[taskId] || 0;

    let totalElapsed = pausedTime;

    if (startTime) {
      // Timer activo: sumar tiempo actual
      totalElapsed += (Date.now() - startTime);
    }

    if (totalElapsed === 0 && !startTime) return null;

    const hours = Math.floor(totalElapsed / (1000 * 60 * 60));
    const minutes = Math.floor((totalElapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalElapsed % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Función para formatear horas en formato legible
  const formatHours = (hours) => {
    if (!hours || hours === 0) return "0min";

    const totalMinutes = Math.round(hours * 60);

    if (totalMinutes < 60) {
      return `${totalMinutes}min`;
    }

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (m === 0) {
      return `${h}h`;
    }

    return `${h}h ${m}min`;
  };

  // Función para convertir texto como "1h 30min" o "45min" a horas decimales
  const parseTimeInput = (timeStr) => {
    if (!timeStr || timeStr.trim() === '') return null;

    const str = timeStr.toLowerCase().trim();

    // Patrones: "1h 30min", "1h30min", "1.5h", "45min", "2h", "90"
    const hourMinPattern = /(\d+)h\s*(\d+)min/;
    const hourOnlyPattern = /(\d+)h$/;
    const minOnlyPattern = /(\d+)min$/;
    const decimalPattern = /^(\d*\.?\d+)h?$/;

    let totalHours = 0;

    if (hourMinPattern.test(str)) {
      const match = str.match(hourMinPattern);
      totalHours = parseInt(match[1]) + parseInt(match[2]) / 60;
    } else if (hourOnlyPattern.test(str)) {
      const match = str.match(hourOnlyPattern);
      totalHours = parseInt(match[1]);
    } else if (minOnlyPattern.test(str)) {
      const match = str.match(minOnlyPattern);
      totalHours = parseInt(match[1]) / 60;
    } else if (decimalPattern.test(str)) {
      const match = str.match(decimalPattern);
      totalHours = parseFloat(match[1]);
    } else {
      // Asumir que es un número simple en horas
      const num = parseFloat(str);
      if (!isNaN(num)) {
        totalHours = num;
      }
    }

    return totalHours > 0 ? totalHours : null;
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

      // Usar la voz seleccionada por el usuario o la automática
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = 'es-ES';
      }

      // Detectar si el texto contiene preguntas para ajustar entonación
      const hasQuestion = /[¿?]/.test(text);
      const isQuestion = hasQuestion || text.trim().endsWith('?');

      // Configuración optimizada según plataforma y tipo de contenido
      const mobile = isMobile();
      if (mobile) {
        // Móviles tienen mejores voces, optimizar para velocidad y naturalidad
        utterance.rate = voiceSpeed;
        utterance.pitch = isQuestion ? 1.15 : 1.0; // Pitch más alto para preguntas
        utterance.volume = 1.0;
      } else {
        // Escritorio: velocidad personalizable para mejor fluidez
        utterance.rate = voiceSpeed;
        utterance.pitch = isQuestion ? 1.1 : 0.95; // Pitch más alto para preguntas
        utterance.volume = 0.9;
      }

      // Ajustar inflexión para preguntas añadiendo pausas estratégicas
      if (isQuestion) {
        // Añadir pequeñas pausas antes de signos de interrogación para mejor entonación
        text = text.replace(/([^.!?])\?/g, '$1... ?')
                  .replace(/¿([^?]+)\?/g, '¿ $1 ?');
      }

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

  // Función para extraer texto limpio para voz (sin reportes técnicos)
  const extractConversationalText = (fullText) => {
    // Patrones que identifican reportes técnicos que NO deben leerse por voz
    const reportPatterns = [
      /📊.*?REPORTE.*?:/i,
      /##.*?PROYECTOS.*?:/i,
      /##.*?TAREAS.*?:/i,
      /##.*?ESTADO.*?:/i,
      /##.*?PROGRESO.*?:/i,
      /\*\*.*?Proyectos.*?:/i,
      /\*\*.*?Tareas.*?:/i,
      /\*\*.*?Estado.*?:/i,
      /- \*\*.*?\*\*.*?:/,
      /\d+\.\s+\*\*.*?\*\*.*?:/,
      /\|\s*Proyecto\s*\|/i,
      /\|\s*Tarea\s*\|/i,
      /\|\s*Estado\s*\|/i,
      /.*?\(\d+%.*?completado\)/i, // Evitar leer "(65% completado)"
      /.*?\(0%.*?completado\)/i,   // Evitar leer "(0% completado)"
      /Testing.*?SmartChatix.*?\(/i, // Evitar leer nombres técnicos de tareas
      /Subir.*?Versión.*?\(/i,
      /Configurar.*?Base.*?\(/i
    ];

    // Si contiene patrones de reporte, extraer solo la parte conversacional al final
    for (let pattern of reportPatterns) {
      if (pattern.test(fullText)) {
        // Buscar la última parte que sea conversacional (después de reportes)
        const lines = fullText.split('\n');
        let conversationalLines = [];
        let foundConversational = false;

        // Buscar desde el final hacia atrás para encontrar texto conversacional
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();

          // Si es una línea vacía, continuar
          if (!line) continue;

          // Si contiene patrones de reporte, parar
          if (reportPatterns.some(p => p.test(line))) {
            break;
          }

          // Si es texto conversacional, agregarlo
          if (line.length > 0 && !line.startsWith('|') && !line.startsWith('#')) {
            conversationalLines.unshift(line);
            foundConversational = true;
          }
        }

        if (foundConversational && conversationalLines.length > 0) {
          fullText = conversationalLines.join(' ');
        } else {
          // Si no hay parte conversacional, crear una respuesta analítica genérica
          // Analizar el contenido para generar resumen inteligente
          const projectCount = (fullText.match(/\*\*.*?\*\*.*?:/g) || []).length;
          const hasDeadlines = /octubre|deadline|fecha.*límite/i.test(fullText);
          const hasLowProgress = /0%|5%|10%/i.test(fullText);

          if (projectCount > 3) {
            return hasLowProgress
              ? `¡Órale! Tienes ${projectCount} proyectos y varios están estancados. ¿Cuál vamos a empujar primero?`
              : `¡Órale! Tienes ${projectCount} proyectos en marcha. ¿En cuál te concentras hoy?`;
          } else if (hasDeadlines && hasLowProgress) {
            return "¡Órale! Varias tareas están en 0% y se acerca el deadline. ¡Necesitamos acelerar YA!";
          } else {
            return "¡Órale! Sigamos empujando esos proyectos. Todo va tomando forma.";
          }
        }
        break;
      }
    }

    // Limpiar markdown y emojis del texto conversacional
    let cleanText = fullText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[📊🚀✅📝🎯💡🔸⏰📋🤔🎉💭⚡💪🎊🔥💥]/g, '')
      .replace(/##\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanText || "¡Sigamos adelante!";
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

        const response = await authenticatedFetch(`${getApiBase()}/auth/projects`, {
          method: 'POST',
          body: JSON.stringify(projectData)
        });

        if (response.ok) {
          const data = await response.json();
          // El servidor devuelve directamente el proyecto
          setProjects([...projects, { ...data, tasks: [] }]);
          setNewProject({ title: '', priority: 'media', deadline: '', description: '' });
          setShowCreateProject(false);
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
      const deleteUrl = `${getApiBase()}/auth/projects/${projectId}`;
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
  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setEditTaskName(task.title || task.text || '');
    setEditTaskDescription(task.description || '');

    // Convertir horas decimales a horas y minutos (estimado)
    const totalEstimatedHours = task.estimated_hours || 0;
    const estimatedHours = Math.floor(totalEstimatedHours);
    const estimatedMinutes = Math.round((totalEstimatedHours - estimatedHours) * 60);

    setEditEstimatedHours(estimatedHours > 0 ? estimatedHours.toString() : '');
    setEditEstimatedMinutes(estimatedMinutes > 0 ? estimatedMinutes.toString() : '');

    // Convertir horas decimales a horas y minutos (real)
    const totalActualHours = task.actual_hours || 0;
    const actualHours = Math.floor(totalActualHours);
    const actualMinutes = Math.round((totalActualHours - actualHours) * 60);

    setEditActualHours(actualHours > 0 ? actualHours.toString() : '');
    setEditActualMinutes(actualMinutes > 0 ? actualMinutes.toString() : '');

    // Setear proyecto vinculado si es una tarea diaria
    setEditTaskProject(task.projectId || '');

    setShowEditTaskModal(true);
  };

  const closeEditTaskModal = () => {
    setShowEditTaskModal(false);
    setEditingTask(null);
    setEditTaskName('');
    setEditTaskDescription('');
    setEditEstimatedHours('');
    setEditEstimatedMinutes('');
    setEditActualHours('');
    setEditActualMinutes('');
    setEditTaskProject('');
  };

  const saveTaskChanges = async () => {
    if (!editTaskName.trim() || !editingTask) return;

    // Detectar si es una tarea diaria o de proyecto
    const isDailyTask = dailyTasks.some(task => task.id === editingTask.id);

    if (isDailyTask) {
      // Usar función específica para tareas diarias
      await saveDailyTaskChanges();
    } else {
      // Usar función específica para tareas de proyecto
      await saveProjectTaskChanges();
    }
  };

  const saveProjectTaskChanges = async () => {
    if (!editTaskName.trim() || !editingTask) return;

    // Calcular tiempo estimado total en horas
    const estimatedHours = parseInt(editEstimatedHours) || 0;
    const estimatedMinutes = parseInt(editEstimatedMinutes) || 0;
    const totalEstimatedHours = estimatedHours + (estimatedMinutes / 60);

    // Calcular tiempo real total en horas
    const actualHours = parseInt(editActualHours) || 0;
    const actualMinutes = parseInt(editActualMinutes) || 0;
    const totalActualHours = actualHours + (actualMinutes / 60);

    const updatedTask = {
      ...editingTask,
      title: editTaskName.trim(),
      text: editTaskName.trim(),
      description: editTaskDescription.trim(),
      estimated_hours: totalEstimatedHours > 0 ? totalEstimatedHours : null,
      actual_hours: totalActualHours > 0 ? totalActualHours : null,
    };

    try {
      // Actualizar en backend si es necesario
      // ... aquí iría la llamada al API

      // Actualizar el estado local
      setProjects(projects.map(project => {
        const updatedTasks = project.tasks.map(task =>
          task.id === editingTask.id ? updatedTask : task
        );
        return { ...project, tasks: updatedTasks };
      }));

      // Actualizar selectedProject también
      if (selectedProject) {
        setSelectedProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === editingTask.id ? updatedTask : task
          )
        }));
      }

      closeEditTaskModal();
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

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
        const response = await authenticatedFetch(`${getApiBase()}/auth/project-tasks`, {
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
    // Si se está completando la tarea y tiene tiempo estimado, mostrar modal
    if (completed) {
      const project = projects.find(p => p.id === projectId);
      const task = project?.tasks.find(t => t.id === taskId);

      // Si hay un timer activo, detenerlo y obtener el tiempo
      let timerHours = 0;
      if (activeTimers[taskId]) {
        timerHours = stopTimer(taskId);
      }

      if (task && task.estimated_hours && !task.actual_hours) {
        // Mostrar modal de tiempo real con el tiempo del timer como sugerencia
        setCompletingTask({
          ...task,
          projectId: projectId,
          suggestedHours: timerHours > 0 ? Math.round(timerHours * 100) / 100 : null // Redondear a 2 decimales
        });
        setShowTimeModal(true);
        return; // No completar aún, se completará cuando se envíe el tiempo
      }
    }

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
        id: task.id, // Usar el mismo ID de la tarea de proyecto para sincronizar timers
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
      projectId: selectedProjectForTask === 'personal' ? null : selectedProjectForTask,
      projectTaskId: null,
      estimated_hours: null,
      actual_hours: null,
      description: ''
    };

    try {
      const response = await authenticatedFetch(`${getApiBase()}/auth/daily-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      if (response.ok) {
        setDailyTasks([...dailyTasks, task]);
        // Para tareas personales, resetear completamente
        resetAddTaskForm();
      } else {
        console.error('Error al guardar tarea diaria');
      }
    } catch (error) {
      console.error('Error:', error);
      // Si falla la petición, al menos actualizar localmente
      setDailyTasks([...dailyTasks, task]);
      // Para tareas personales, resetear completamente
      resetAddTaskForm();
    }
  };

  // Funciones para el nuevo flujo de agregar tareas
  const resetAddTaskForm = () => {
    setShowAddTaskForm(false);
    setShowProjectSelectionModal(false);
    setModalStep(1);
    setSelectedProjectForTask('');
    setSelectedProjectTaskId('');
    setAddTaskMode('');
    setNewDailyTask('');
    setShowNewTaskInput(false);
  };

  const handleProjectSelection = (projectId) => {
    setSelectedProjectForTask(projectId);

    if (projectId === 'personal') {
      // Proyecto personal - mostrar entrada de tarea en el modal
      setAddTaskMode('personal');
      setModalStep(2);
    } else if (projectId) {
      // Proyecto específico - mostrar tareas disponibles en el modal
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const availableTasks = project.tasks.filter(task =>
          !dailyTasks.some(dt => dt.projectId === projectId && dt.projectTaskId === task.id)
        );
        setSelectedProjectTasks(availableTasks);
      }
      setAddTaskMode('project');
      setModalStep(2);
    }
  };

  const openProjectSelectionModal = () => {
    setShowProjectSelectionModal(true);
    setModalStep(1);
  };

  const goBackToProjectSelection = () => {
    setModalStep(1);
    setSelectedProjectForTask('');
    setAddTaskMode('');
    setNewDailyTask('');
  };

  const addExistingProjectTask = async (taskId) => {
    if (!taskId || !selectedProjectForTask) return;

    const project = projects.find(p => p.id === selectedProjectForTask);
    const projectTask = project?.tasks.find(t => t.id === taskId);

    if (!projectTask) return;

    const dailyTask = {
      id: taskId, // Usar el mismo ID de la tarea de proyecto para sincronizar timers
      text: projectTask.title || projectTask.text,
      completed: projectTask.completed || false,
      projectId: selectedProjectForTask,
      projectTaskId: taskId,
      estimated_hours: projectTask.estimated_hours || null,
      actual_hours: projectTask.actual_hours || null,
      description: projectTask.description || ''
    };

    try {
      const response = await authenticatedFetch(`${getApiBase()}/auth/daily-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: dailyTask }),
      });

      if (response.ok) {
        setDailyTasks([...dailyTasks, dailyTask]);
        // Cerrar modal para ver la tarea agregada en "Tareas de Hoy"
        resetAddTaskForm();
      } else {
        console.error('Error al guardar tarea diaria');
      }
    } catch (error) {
      console.error('Error:', error);
      // Si falla la petición, al menos actualizar localmente
      setDailyTasks([...dailyTasks, dailyTask]);
      // Cerrar modal para ver la tarea agregada en "Tareas de Hoy"
      resetAddTaskForm();
    }
  };

  const addNewTaskToProject = async () => {
    if (!newDailyTask.trim() || !selectedProjectForTask) return;

    // Crear la tarea en el proyecto primero
    const newTask = {
      id: Date.now(),
      title: newDailyTask.trim(),
      text: newDailyTask.trim(),
      description: '',
      completed: false,
      progress: 0,
      estimated_hours: null,
      actual_hours: null,
      createdAt: new Date().toLocaleDateString()
    };

    // Actualizar el proyecto con la nueva tarea
    setProjects(prevProjects => {
      return prevProjects.map(project =>
        project.id === selectedProjectForTask
          ? { ...project, tasks: [...project.tasks, newTask] }
          : project
      );
    });

    // Crear la tarea diaria vinculada
    const dailyTask = {
      id: newTask.id, // Usar el mismo ID de la tarea de proyecto para sincronizar timers
      text: newDailyTask.trim(),
      completed: false,
      projectId: selectedProjectForTask,
      projectTaskId: newTask.id,
      estimated_hours: null,
      actual_hours: null,
      description: ''
    };

    try {
      const response = await authenticatedFetch(`${getApiBase()}/auth/daily-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: dailyTask }),
      });

      if (response.ok) {
        setDailyTasks([...dailyTasks, dailyTask]);
        // Cerrar modal para ver la tarea agregada en "Tareas de Hoy"
        resetAddTaskForm();
      } else {
        console.error('Error al guardar tarea diaria');
      }
    } catch (error) {
      console.error('Error:', error);
      // Si falla la petición, al menos actualizar localmente
      setDailyTasks([...dailyTasks, dailyTask]);
      // Cerrar modal para ver la tarea agregada en "Tareas de Hoy"
      resetAddTaskForm();
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
    console.log('🗑️ [DEBUG] deleteProjectTask llamada con:', { projectId, taskId });
    try {
      // Eliminar de la base de datos primero
      const deleteUrl = `${getApiBase()}/auth/project-tasks/${taskId}`;
      console.log('🗑️ Eliminando tarea con URL:', deleteUrl);
      const response = await authenticatedFetch(deleteUrl, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error('Error eliminando tarea del servidor');
        // Si la tarea no existe en el servidor (404), eliminarla solo localmente
        if (response.status === 404) {
          console.log('🗑️ Tarea no existe en servidor, eliminando solo localmente');
          // Eliminar localmente y continuar
        } else {
          return; // Otros errores sí deben detener la ejecución
        }
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

    // Actualizar estado local usando función para garantizar estado actual
    setProjects(currentProjects => currentProjects.map(project => {
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

        await authenticatedFetch(`${getApiBase()}/auth/projects/${projectId}`, {
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
          estimated_hours: newTaskEstimatedHours ? parseTimeInput(newTaskEstimatedHours) : null,
          actual_hours: null,
          time_started: null,
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
        setNewTaskEstimatedHours('');
        setIsAddingTask(false);
        console.log('✅ Tarea agregada localmente, input limpiado');

        // Opcional: guardar en base de datos en segundo plano
        try {
          const response = await authenticatedFetch(`${getApiBase()}/auth/project-tasks`, {
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
        required: ["title"]
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

  // Herramientas en formato Gemini
  const geminiTools = [
    {
      functionDeclarations: assistantFunctions
    }
  ];

  console.log('🔍 [DEBUG] Gemini Tools configuradas:', JSON.stringify(geminiTools, null, 2));

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
  const createProjectFromAssistant = async (params) => {
    console.log('🚀 [DEBUG] createProjectFromAssistant EJECUTÁNDOSE con params:', params);
    try {
      const projectData = {
        title: params.title,
        description: params.description || '',
        priority: params.priority || 'media',
        deadline: params.deadline || '',
        status: 'activo',
        progress: 0,
        createdAt: new Date().toLocaleDateString(),
        tasks: []
      };

      // Guardar en la base de datos
      console.log('🔍 [DEBUG] Enviando proyecto a BD:', projectData);
      const response = await authenticatedFetch(`${getApiBase()}/auth/projects`, {
        method: 'POST',
        body: JSON.stringify({ project: projectData })
      });

      console.log('🔍 [DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Proyecto guardado en BD:', data);
        // El servidor devuelve directamente el proyecto con ID de BD
        setProjects(prev => [...prev, { ...data, tasks: [] }]);
      } else {
        const errorText = await response.text();
        console.error('🚨 [DEBUG] Error guardando en BD:', response.status, errorText);
        // Fallback: guardar localmente si hay error de conexión
        const project = {
          id: Date.now(),
          ...projectData
        };
        setProjects(prev => [...prev, project]);
      }

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

  // Función para búsqueda inteligente de proyectos (tolerante a tildes y variaciones)
  const findProjectByTitle = (searchTitle) => {
    if (!searchTitle) return null;

    // Normalizar texto removiendo tildes y caracteres especiales
    const normalize = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover tildes
        .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
    };

    const normalizedSearch = normalize(searchTitle);

    // Buscar coincidencia exacta primero
    let project = projects.find(p => normalize(p.title) === normalizedSearch);

    // Si no encuentra exacta, buscar que contenga las palabras principales
    if (!project) {
      const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
      project = projects.find(p => {
        const normalizedTitle = normalize(p.title);
        return searchWords.every(word => normalizedTitle.includes(word));
      });
    }

    // Si aún no encuentra, buscar coincidencia parcial
    if (!project) {
      project = projects.find(p => normalize(p.title).includes(normalizedSearch));
    }

    return project;
  };

  // Función para búsqueda inteligente de tareas dentro de un proyecto
  const findTaskByTitle = (project, searchTitle) => {
    if (!project || !searchTitle || !project.tasks) return null;

    // Normalizar texto removiendo tildes y caracteres especiales
    const normalize = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover tildes
        .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
    };

    const normalizedSearch = normalize(searchTitle);

    // Buscar coincidencia exacta primero
    let task = project.tasks.find(t => normalize(t.title) === normalizedSearch);

    // Si no encuentra exacta, buscar que contenga las palabras principales
    if (!task) {
      const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
      task = project.tasks.find(t => {
        const normalizedTitle = normalize(t.title);
        return searchWords.every(word => normalizedTitle.includes(word));
      });
    }

    // Si aún no encuentra, buscar coincidencia parcial
    if (!task) {
      task = project.tasks.find(t => normalize(t.title).includes(normalizedSearch));
    }

    return task;
  };

  const addProjectTaskFromAssistant = async (params) => {
    try {
      const project = findProjectByTitle(params.project_title);
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}". ¿Quieres que primero creemos ese proyecto?` };
      }

      const task = {
        title: params.task_title,
        description: params.description || '',
        completed: false,
        progress: 0,
        createdAt: new Date().toLocaleDateString()
      };

      // Guardar en la base de datos
      console.log('🔍 [DEBUG] Enviando tarea a BD:', { projectId: project.id, task });
      const response = await authenticatedFetch(`${getApiBase()}/auth/project-tasks`, {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          task: task
        })
      });

      console.log('🔍 [DEBUG] Response status (tarea):', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Tarea guardada en BD:', data);
        if (data.success) {
          // Actualizar estado local con la tarea guardada
          setProjects(prev => prev.map(p =>
            p.id === project.id
              ? { ...p, tasks: [...p.tasks, { ...task, id: data.task.id }] }
              : p
          ));
        }
      } else {
        const errorText = await response.text();
        console.error('🚨 [DEBUG] Error guardando tarea en BD:', response.status, errorText);
        // Fallback: guardar localmente si hay error de conexión
        const localTask = { id: Date.now(), ...task };
        setProjects(prev => prev.map(p =>
          p.id === project.id
            ? { ...p, tasks: [...p.tasks, localTask] }
            : p
        ));
      }

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
      const progressValue = Math.max(0, Math.min(100, parseInt(params.progress) || 0));
      let projectFound = null;
      let taskFound = null;

      // Buscar proyecto y tarea, y actualizar en una sola operación
      setProjects(currentProjects => {
        const updatedProjects = currentProjects.map(project => {
          // Buscar proyecto por título
          const normalize = (str) => {
            return str.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          };

          const normalizedSearch = normalize(params.project_title);
          const normalizedTitle = normalize(project.title);

          if (normalizedTitle === normalizedSearch || normalizedTitle.includes(normalizedSearch)) {
            projectFound = project;

            // Buscar tarea dentro del proyecto
            const updatedTasks = project.tasks.map(task => {
              const normalizedTaskSearch = normalize(params.task_title);
              const normalizedTaskTitle = normalize(task.title);

              if (normalizedTaskTitle === normalizedTaskSearch || normalizedTaskTitle.includes(normalizedTaskSearch)) {
                taskFound = task;
                console.log(`🔍 [DEBUG] Actualizando tarea "${task.title}" de ${task.progress}% a ${progressValue}%`);

                return {
                  ...task,
                  progress: progressValue,
                  completed: progressValue === 100
                };
              }
              return task;
            });

            // Calcular progreso promedio del proyecto
            const totalProgress = updatedTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
            const averageProgress = updatedTasks.length > 0 ? Math.round(totalProgress / updatedTasks.length) : 0;

            return { ...project, tasks: updatedTasks, progress: averageProgress };
          }
          return project;
        });

        return updatedProjects;
      });

      if (!projectFound) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      if (!taskFound) {
        return { success: false, message: `No se encontró la tarea "${params.task_title}" en el proyecto "${projectFound.title}".` };
      }

      // Intentar guardar en la base de datos (actualizar proyecto completo)
      try {
        const updatedProject = projects.find(p => p.id === projectFound.id);
        if (updatedProject) {
          const response = await authenticatedFetch(`${getApiBase()}/auth/projects/${projectFound.id}`, {
            method: 'PUT',
            body: JSON.stringify({ project: updatedProject })
          });

          if (!response.ok) {
            console.warn('No se pudo sincronizar con la base de datos, pero se actualizó localmente');
          }
        }
      } catch (error) {
        console.warn('Error sincronizando con BD:', error);
      }

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
        message: `${progressMessage} He actualizado "${taskFound.title}" al ${params.progress}%. ${params.progress === 100 ? "¿Qué sigue ahora?" : "¿Necesitas ajustar algo más?"}`
      };
    } catch (error) {
      return { success: false, message: "Error al actualizar el progreso: " + error.message };
    }
  };

  const addTaskToDailyFocusFromAssistant = (params) => {
    try {
      const project = findProjectByTitle(params.project_title);
      if (!project) {
        return { success: false, message: `No se encontró el proyecto "${params.project_title}".` };
      }

      const task = findTaskByTitle(project, params.task_title);
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
      const project = findProjectByTitle(params.project_title);
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
        await authenticatedFetch(`${getApiBase()}/auth/projects/${project.id}`, {
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

      const project = findProjectByTitle(params.project_title);
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
        await authenticatedFetch(`${getApiBase()}/auth/projects/${project.id}`, {
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
      const project = findProjectByTitle(params.project_title);
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
        await authenticatedFetch(`${getApiBase()}/auth/projects/${project.id}`, {
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
      const project = findProjectByTitle(params.project_title);
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
        await authenticatedFetch(`${getApiBase()}/auth/projects/${project.id}`, {
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
      const project = findProjectByTitle(params.project_title);
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
        await authenticatedFetch(`${getApiBase()}/auth/projects/${project.id}`, {
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

      await authenticatedFetch(`${getApiBase()}/auth/chat-messages`, {
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

      await authenticatedFetch(`${getApiBase()}/auth/insights`, {
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

      await authenticatedFetch(`${getApiBase()}/auth/commitments`, {
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

      await authenticatedFetch(`${getApiBase()}/auth/achievements`, {
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
        authenticatedFetch(`${getApiBase()}/auth/insights`),
        authenticatedFetch(`${getApiBase()}/auth/commitments`),
        authenticatedFetch(`${getApiBase()}/auth/achievements`)
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

    const focusAreasText = Object.entries(assistantConfig.focusAreas)
      .filter(([_, isActive]) => isActive)
      .map(([area, _]) => area)
      .join(', ');

    // Usar la nueva configuración del prompt
    return getPromptConfig(assistantConfig, dateString, timeString, voiceEnabled, focusAreasText);
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
      console.log('🔍 [DEBUG] Mensaje del usuario:', currentMessage);

      // Detectar si el usuario quiere usar funciones de base de datos
      console.log('🔍 [DEBUG] Evaluando mensaje para function calling:', currentMessage);

      const functionKeywords = [
        'proyectos', 'proyecto', 'tarea', 'tareas', 'progreso', 'estado de proyectos',
        'mostrar proyectos', 'listar proyectos', 'crear proyecto', 'nuevo proyecto',
        'agregar tarea', 'añadir tarea', 'actualizar', 'cambiar prioridad', 'fecha límite',
        'deadline', 'eliminar proyecto', 'completar proyecto', 'enfoque diario', 'tareas pendientes',
        'que proyectos', 'cuáles proyectos', 'status', 'resumen', 'actualiz', 'al ', '%',
        'terminado', 'acabar', 'completar', 'listo', 'lanzar', 'lanzamiento'
      ];

      const needsFunctionCall = functionKeywords.some(keyword =>
        currentMessage.toLowerCase().includes(keyword)
      );

      console.log('🔍 [DEBUG] Necesita function call?:', needsFunctionCall);
      console.log('🔍 [DEBUG] Keywords encontradas:', functionKeywords.filter(k => currentMessage.toLowerCase().includes(k)));

      let assistantResponse = '';
      let functionResults = [];

      if (needsFunctionCall) {
        console.log('🔍 [DEBUG] Usando Gemini con function calling');

        // Llamada directa a Gemini con function calling
        const conversationHistory = formatConversationHistory();
        console.log('🔍 [DEBUG] Conversation history for functions:', conversationHistory.length, 'mensajes');

        // Convertir historial al formato de Gemini
        const contents = [];

        // Agregar mensaje de sistema
        contents.push({
          role: 'user',
          parts: [{
            text: `Eres un asistente de gestión de proyectos. SIEMPRE DEBES USAR LAS FUNCIONES DISPONIBLES para:

- Cuando el usuario dice "crea", "crear", "nuevo proyecto" → Usa create_project
- Cuando el usuario dice "agrega", "añadir", "nueva tarea" → Usa add_project_task
- Cuando el usuario dice "actualiza", "progreso", "al X%" → Usa update_task_progress
- Cuando el usuario pregunta por proyectos, estado → Usa get_projects_status

IMPORTANTE: SIEMPRE usa las funciones, no respondas solo con texto.`
          }]
        });

        // Agregar historial de conversación
        conversationHistory.forEach(msg => {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        });

        // Agregar mensaje actual
        contents.push({
          role: 'user',
          parts: [{ text: currentMessage }]
        });

        const geminiRequestBody = {
          contents: contents,
            tools: geminiTools,
            toolConfig: {
              functionCallingConfig: {
                mode: 'any'
              }
            },
            generationConfig: {
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 1000,
            }
          };

          console.log('🔍 [DEBUG] Request body con datos:', JSON.stringify(geminiRequestBody, null, 2));

        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiRequestBody)
          });

          if (!response.ok) {
            throw new Error(`Error de Gemini: ${response.status}`);
          }

          const result = await response.json();
          console.log('🔍 [DEBUG] Gemini result (con datos):', JSON.stringify(result, null, 2));

          if (result.candidates && result.candidates.length > 0) {
            const candidate = result.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              const parts = candidate.content.parts;
              console.log('🔍 [DEBUG] Parts de la respuesta (con datos):', parts);

              // Buscar function calls
              let functionResults = [];
              for (const part of parts) {
                if (part.functionCall) {
                  console.log('🔍 [DEBUG] Function call detectado (con datos):', part.functionCall);
                  const functionName = part.functionCall.name;
                  const functionArgs = part.functionCall.args;

                  // Ejecutar la función
                  try {
                    const result = await executeAssistantFunction(functionName, functionArgs);
                    functionResults.push(result);
                    console.log('🔍 [DEBUG] Resultado de función (con datos):', result);
                  } catch (error) {
                    console.error('🚨 Error ejecutando función (con datos):', error);
                    functionResults.push({ success: false, message: 'Error ejecutando función' });
                  }
                } else if (part.text) {
                  assistantResponse = part.text;
                }
              }

              // Si hay resultados de funciones, usar el mensaje de la función
              if (functionResults.length > 0) {
                const successfulResults = functionResults.filter(r => r.success);
                if (successfulResults.length > 0) {
                  assistantResponse = successfulResults[0].message;
                }
              } else {
                // Si no hay function calls, usar el texto normal
                assistantResponse = candidate.content.parts[0].text;
              }

            } else if (candidate.finishReason === 'SAFETY') {
              assistantResponse = '🛡️ La respuesta fue filtrada por seguridad. ¿Podrías reformular tu pregunta?';
            } else {
              console.error('🚨 Candidato sin contenido válido:', candidate);
              assistantResponse = 'Lo siento, no pude generar una respuesta en este momento.';
            }
          } else if (result.error) {
            console.error('🚨 Error en API de Gemini:', result.error);
            assistantResponse = `⚠️ Error en respuesta de IA: ${result.error.message}`;
          } else {
            console.error('🚨 Estructura inesperada completa:', result);
            assistantResponse = 'Respuesta de Gemini en formato inesperado';
          }
        } catch (error) {
          console.error('🚨 Error en llamada a Gemini con functions:', error);
          assistantResponse = 'Error procesando tu solicitud. Inténtalo de nuevo.';
        }
      } else {
        // Llamada normal a Gemini para coaching sin funciones
        console.log('🔍 [DEBUG] Usando llamada normal a Gemini (sin funciones)');

        try {
          const systemPrompt = await buildSystemPrompt() || 'Eres un asistente personal útil.';
          const conversationHistory = formatConversationHistory();

          console.log('🔍 [DEBUG] System prompt obtenido:', systemPrompt?.substring(0, 100) + '...');
          console.log('🔍 [DEBUG] Conversation history:', conversationHistory?.length, 'mensajes');

          const promptText = `Contexto: Eres un coach motivacional, aliado estratégico y asistente de proyectos. Tu rol es ayudar al usuario a gestionar proyectos, motivarlos y dar consejos estratégicos.

Sistema prompt: ${systemPrompt}

Historial de conversación:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Usuario: ${currentMessage}`;

          console.log('🔍 [DEBUG] Prompt final enviado a Gemini:', promptText.substring(0, 200) + '...');

          const geminiRequestBody = {
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ],
            tools: geminiTools,
            toolConfig: {
              functionCallingConfig: {
                mode: 'any'
              }
            },
            generationConfig: {
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 1000,
            }
          };

          console.log('🔍 [DEBUG] Enviando request a Gemini...');
          console.log('🔍 [DEBUG] Request body completo:', JSON.stringify(geminiRequestBody, null, 2));

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiRequestBody)
          });

          console.log('🔍 [DEBUG] Response status:', response.status);
          console.log('🔍 [DEBUG] Response ok:', response.ok);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('🚨 Error response body:', errorText);
            throw new Error(`Error de Gemini: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          console.log('🔍 [DEBUG] Gemini result completo:', JSON.stringify(result, null, 2));

          if (result.candidates && result.candidates.length > 0) {
            const candidate = result.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              const parts = candidate.content.parts;
              console.log('🔍 [DEBUG] Parts de la respuesta:', parts);

              // Buscar function calls
              let functionResults = [];
              for (const part of parts) {
                if (part.functionCall) {
                  console.log('🔍 [DEBUG] Function call detectado:', part.functionCall);
                  const functionName = part.functionCall.name;
                  const functionArgs = part.functionCall.args;

                  // Ejecutar la función
                  try {
                    const result = await executeAssistantFunction(functionName, functionArgs);
                    functionResults.push(result);
                    console.log('🔍 [DEBUG] Resultado de función:', result);
                  } catch (error) {
                    console.error('🚨 Error ejecutando función:', error);
                    functionResults.push({ success: false, message: 'Error ejecutando función' });
                  }
                } else if (part.text) {
                  assistantResponse = part.text;
                  console.log('🔍 [DEBUG] Assistant response extraída:', assistantResponse);
                }
              }

              // Si hay resultados de funciones, usar el mensaje de la función
              if (functionResults.length > 0) {
                const successfulResults = functionResults.filter(r => r.success);
                if (successfulResults.length > 0) {
                  assistantResponse = successfulResults[0].message;
                }
              }

            } else if (candidate.finishReason === 'SAFETY') {
              assistantResponse = '🛡️ La respuesta fue filtrada por seguridad. ¿Podrías reformular tu pregunta?';
            } else {
              console.error('🚨 Candidato sin contenido válido:', candidate);
              assistantResponse = 'Lo siento, no pude generar una respuesta en este momento.';
            }
          } else if (result.error) {
            console.error('🚨 Error en API de Gemini:', result.error);
            throw new Error(`Error de Gemini API: ${result.error.message}`);
          } else {
            console.error('🚨 Estructura inesperada de respuesta:', result);
            assistantResponse = 'Respuesta de Gemini en formato inesperado';
          }

        } catch (innerError) {
          console.error('🚨 Error en llamada normal a Gemini:', innerError);
          throw innerError;
        }
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
        // La voz debe ser idéntica al texto (solo limpiar markdown)
        const voiceText = assistantResponse
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Remover bold
          .replace(/\*(.*?)\*/g, '$1')      // Remover italic
          .replace(/`([^`]+)`/g, '$1')      // Remover code
          .replace(/##\s*/g, '')           // Remover headers
          .replace(/[📊🚀✅📝🎯💡🔸⏰📋🤔🎉💭⚡💪🎊🔥💥]/g, '') // Remover emojis
          .replace(/\s+/g, ' ')            // Normalizar espacios
          .trim();

        if (voiceText) {
          speakText(voiceText);
        }
      }

    } catch (error) {
      console.error('🚨 Error enviando mensaje:', error);
      console.error('🚨 Error stack:', error.stack);
      console.error('🚨 Error message:', error.message);

      // Mensaje de error para el usuario con información de debug
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `❌ Error de conexión: ${error.message}\n\nPor favor revisa la consola del navegador para más detalles.`,
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
      const completing = !task.completed;

      // Si se está completando la tarea y tiene timer activo, capturar el tiempo
      if (completing) {
        let actualHours = task.actual_hours || 0;

        // Si hay un timer activo, capturar el tiempo
        if (activeTimers[taskId] || pausedTimers[taskId]) {
          const timerHours = completeTask(taskId);
          actualHours = timerHours;
        }

        // Actualizar tarea diaria con el tiempo capturado
        setDailyTasks(dailyTasks.map(t =>
          t.id === taskId ? {
            ...t,
            completed: true,
            actual_hours: actualHours > 0 ? actualHours : task.actual_hours
          } : t
        ));
      } else {
        // Solo cambiar estado de completado
        setDailyTasks(dailyTasks.map(t =>
          t.id === taskId ? { ...t, completed: false } : t
        ));
      }

      // Sincronizar con tarea de proyecto si está vinculada
      if (task.projectId && task.projectTaskId) {
        setProjects(projects.map(project => {
          if (project.id === task.projectId) {
            const updatedTasks = project.tasks.map(pt =>
              pt.id === task.projectTaskId ? { ...pt, completed: completing } : pt
            );
            return { ...project, tasks: updatedTasks };
          }
          return project;
        }));
        updateProjectProgressFromTasks(task.projectId);
      }
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await authenticatedFetch(`${getApiBase()}/auth/daily-tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDailyTasks(dailyTasks.filter(task => task.id !== taskId));
      } else {
        console.error('Error al eliminar tarea diaria');
        // Si falla la petición, al menos actualizar localmente
        setDailyTasks(dailyTasks.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Error:', error);
      // Si falla la petición, al menos actualizar localmente
      setDailyTasks(dailyTasks.filter(task => task.id !== taskId));
    }
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

  // Función para actualizar tareas diarias desde el modal de edición
  const saveDailyTaskChanges = async () => {
    if (!editTaskName.trim() || !editingTask) return;

    // Calcular tiempo estimado total en horas
    const estimatedHours = parseInt(editEstimatedHours) || 0;
    const estimatedMinutes = parseInt(editEstimatedMinutes) || 0;
    const totalEstimatedHours = estimatedHours + (estimatedMinutes / 60);

    // Calcular tiempo real total en horas
    const actualHours = parseInt(editActualHours) || 0;
    const actualMinutes = parseInt(editActualMinutes) || 0;
    const totalActualHours = actualHours + (actualMinutes / 60);

    const updatedTask = {
      ...editingTask,
      text: editTaskName.trim(),
      description: editTaskDescription.trim(),
      estimated_hours: totalEstimatedHours > 0 ? totalEstimatedHours : null,
      actual_hours: totalActualHours > 0 ? totalActualHours : null,
      projectId: editTaskProject || null, // Vincular con proyecto seleccionado
    };

    try {
      // Actualizar el estado local de las tareas diarias
      setDailyTasks(dailyTasks.map(task =>
        task.id === editingTask.id ? updatedTask : task
      ));

      closeEditTaskModal();
    } catch (error) {
      console.error('Error actualizando tarea diaria:', error);
    }
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

    // Obtener información del timer para esta tarea
    const timerDisplay = getTimerDisplay(task.id);
    const isTimerActive = activeTimers[task.id];
    const isTimerPaused = pausedTimers[task.id] && !isTimerActive;

    return (
      <div
        key={task.id}
        className={`flex flex-col p-3 rounded-lg border transition-all duration-200 ${
          task.completed
            ? 'bg-green-50 border-green-200'
            : isUrgent
            ? 'bg-red-50 border-red-200 hover:bg-red-100'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
      >
        {/* Primera fila: Checkbox, nombre de tarea y controles */}
        <div className="flex items-center justify-between">
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
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Controles de timer */}
            {!task.completed && !editingTaskId && (
              <div className="flex items-center gap-1 mr-2">
                {isTimerActive ? (
                  <button
                    onClick={() => pauseTimer(task.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded flex items-center"
                    title="Pausar timer"
                  >
                    <Pause size={14} />
                    {isTimerActive && (
                      <div className="w-2 h-2 bg-red-500 rounded-full ml-1 animate-pulse"></div>
                    )}
                  </button>
                ) : isTimerPaused ? (
                  <button
                    onClick={() => resumeTimer(task.id)}
                    className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1 rounded"
                    title="Reanudar timer"
                  >
                    <Play size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => startTimer(task.id)}
                    className="text-green-500 hover:text-green-700 hover:bg-green-50 p-1 rounded"
                    title="Iniciar timer"
                  >
                    <Play size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Controles de edición */}
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
                  onClick={() => openEditTaskModal(task)}
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

        {/* Segunda fila: Información adicional */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {/* Proyecto vinculado */}
            {project && (
              <span className={`inline-block px-2 py-1 rounded-full font-medium ${getProjectColor(project.id)}`}>
                {project.title}
              </span>
            )}

            {/* Tiempos estimado y real */}
            {(task.estimated_hours || task.actual_hours) && (
              <div className="flex items-center gap-2">
                {task.estimated_hours && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Est: {formatHours(task.estimated_hours)}
                  </span>
                )}
                {task.actual_hours && (
                  <span className={`px-2 py-1 rounded-full ${
                    task.actual_hours > task.estimated_hours
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    Real: {formatHours(task.actual_hours)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Timer display */}
          {timerDisplay && (
            <div className={`px-2 py-1 rounded-full font-mono text-xs ${
              isTimerActive
                ? 'bg-red-100 text-red-800'
                : isTimerPaused
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {timerDisplay}
            </div>
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
                    onClick={openProjectSelectionModal}
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

            {/* Botón de agregar tarea - Solo mostrar cuando hay tareas */}
            {dailyTasks.length > 0 && (
              <div className="mt-3 md:mt-4 flex-shrink-0">
                <button
                  onClick={openProjectSelectionModal}
                  className="w-full bg-blue-50 text-blue-600 px-3 py-2.5 md:px-4 md:py-3 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium flex items-center justify-center border border-blue-200 hover:border-blue-300 transition-all duration-200"
                >
                  <Plus size={16} className="mr-2" />
                  <span className="hidden sm:inline">Agregar nueva tarea</span>
                  <span className="sm:hidden">Nueva tarea</span>
                </button>
              </div>
            )}
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
  const saveVoiceConfig = async () => {
    try {
      // Guardar configuración de voz en localStorage
      const voiceConfig = {
        voiceEnabled: voiceEnabled,
        voiceSpeed: voiceSpeed,
        selectedVoice: selectedVoice ? {
          name: selectedVoice.name,
          lang: selectedVoice.lang,
          localService: selectedVoice.localService
        } : null
      };

      localStorage.setItem('voiceConfig', JSON.stringify(voiceConfig));
      console.log('Configuración de voz guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración de voz:', error);
      throw error;
    }
  };

  // Función para demo de voz
  const playVoiceDemo = () => {
    if (!voiceEnabled || !selectedVoice) {
      alert('Habilita la voz y selecciona una voz primero');
      return;
    }

    const demoText = "La paz sea contigo. Bienvenido a SmartChatix.";

    if (synthesisRef.current) {
      // Detener cualquier reproducción anterior
      synthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(demoText);
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;

      // Detectar si el texto contiene preguntas para ajustar entonación
      const hasQuestion = /[¿?]/.test(demoText);
      const isQuestion = hasQuestion || demoText.trim().endsWith('?');

      // Configuración optimizada según plataforma y tipo de contenido
      const mobile = isMobile();
      if (mobile) {
        utterance.rate = voiceSpeed;
        utterance.pitch = isQuestion ? 1.15 : 1.0; // Pitch más alto para preguntas
        utterance.volume = 1.0;
      } else {
        utterance.rate = voiceSpeed;
        utterance.pitch = isQuestion ? 1.1 : 0.95; // Pitch más alto para preguntas
        utterance.volume = 0.9;
      }

      synthesisRef.current.speak(utterance);
    }
  };

  // Funciones para los modales
  const saveAssistantConfig = async () => {
    try {
      // Guardar configuración del asistente
      const response = await authenticatedFetch(`${getApiBase()}/auth/assistant-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: assistantConfig }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración del asistente');
      }

      // Guardar configuración de voz
      await saveVoiceConfig();

      setIsConfigSaved(true);
      setTimeout(() => setIsConfigSaved(false), 2000);
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
        const response = await authenticatedFetch(`${getApiBase()}/auth/change-password`, {
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

              {/* Configuración de Voz */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  🎤 Configuración de Voz
                </h3>

                <div className="space-y-4">
                  {/* Checkbox para habilitar voz */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="voiceEnabledMain"
                      checked={voiceEnabled}
                      onChange={(e) => {
                        setVoiceEnabled(e.target.checked);
                        if (!e.target.checked) {
                          stopSpeaking();
                        }
                      }}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="voiceEnabledMain" className="ml-2 text-sm font-medium text-gray-700">
                      Habilitar voz del asistente
                    </label>
                  </div>

                  {/* Selector de voces */}
                  {voiceEnabled && availableVoices.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccionar voz:
                        </label>
                        <select
                          value={selectedVoice?.name || ''}
                          onChange={(e) => {
                            const voice = availableVoices.find(v => v.name === e.target.value);
                            setSelectedVoice(voice);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {availableVoices.map((voice) => {
                            const isQuality = voice.name.toLowerCase().includes('neural') ||
                                            voice.name.toLowerCase().includes('premium') ||
                                            voice.name.toLowerCase().includes('enhanced');
                            const displayName = voice.name.replace(/Microsoft|Google/gi, '').trim() || voice.name;
                            return (
                              <option key={voice.name} value={voice.name}>
                                {displayName} {isQuality ? '🎯 Premium' : '🤖 Básica'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {selectedVoice && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detalles de la voz:
                          </label>
                          <div className="p-3 bg-white border border-gray-300 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Idioma:</span> {selectedVoice.lang}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Tipo:</span> {selectedVoice.localService ? 'Local' : 'Online'}
                            </p>

                            {/* Control de velocidad compacto */}
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Velocidad</span>
                                <span className="text-xs text-orange-600 font-medium">{voiceSpeed}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={voiceSpeed}
                                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${((voiceSpeed - 0.5) / 1.5) * 100}%, #e5e7eb ${((voiceSpeed - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`
                                }}
                              />
                            </div>

                            <button
                              onClick={playVoiceDemo}
                              className="mt-2 w-full px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                            >
                              🎵 Probar Voz
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {/* Información sobre la voz */}
                  {voiceEnabled && availableVoices.length === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No se detectaron voces disponibles. Verifica que tu navegador soporte síntesis de voz.
                      </p>
                    </div>
                  )}

                  {!voiceEnabled && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        La voz está deshabilitada. Habilítala para escuchar las respuestas del asistente.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuración de Timer */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  ⏱️ Cronómetro de Tareas
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cómo quieres trabajar?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="timerMode"
                          value="una_tarea"
                          checked={timerMode === 'una_tarea'}
                          onChange={(e) => setTimerMode(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <span className="font-medium">🎯 Una tarea a la vez</span>
                          <p className="text-sm text-gray-600">Más concentración. Al empezar una nueva tarea, pausa automáticamente la anterior.</p>
                        </div>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="timerMode"
                          value="multiples"
                          checked={timerMode === 'multiples'}
                          onChange={(e) => setTimerMode(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <span className="font-medium">🔄 Varias tareas a la vez</span>
                          <p className="text-sm text-gray-600">Para cuando cambias frecuentemente entre proyectos. Te pregunta antes de agregar otra tarea.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${timerMode === 'una_tarea' ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
                    <p className="text-sm">
                      <strong>Actualmente: {timerMode === 'una_tarea' ? 'Una tarea a la vez' : 'Varias tareas a la vez'}</strong>
                      <br />
                      {timerMode === 'una_tarea'
                        ? 'Te ayuda a mantener el enfoque en una sola cosa.'
                        : 'Perfecto para alternar entre diferentes proyectos.'
                      }
                    </p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
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
                        await authenticatedFetch(`${getApiBase()}/auth/projects/${selectedProject?.id}`, {
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
                          await authenticatedFetch(`${getApiBase()}/auth/projects/${selectedProject?.id}`, {
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
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
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

                          {/* Botón de editar */}
                          <button
                            onClick={() => openEditTaskModal(task)}
                            style={{
                              padding: '4px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.6,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f3f4f6';
                              e.target.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.opacity = '0.6';
                            }}
                            title="Editar tarea"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
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

                      {/* Indicador de tiempo estimado vs real */}
                      {(task.estimated_hours || task.actual_hours) && (
                        <div style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginLeft: '8px'
                        }}>
                          {task.estimated_hours && (
                            <span style={{
                              padding: '2px 4px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '3px',
                              border: '1px solid #e5e7eb'
                            }}>
                              Est: {formatHours(task.estimated_hours)}
                            </span>
                          )}
                          {task.actual_hours && (
                            <span style={{
                              padding: '2px 4px',
                              backgroundColor: task.actual_hours > task.estimated_hours ? '#fef3c7' : '#dcfce7',
                              borderRadius: '3px',
                              border: `1px solid ${task.actual_hours > task.estimated_hours ? '#fbbf24' : '#22c55e'}`,
                              color: task.actual_hours > task.estimated_hours ? '#92400e' : '#166534'
                            }}>
                              Real: {formatHours(task.actual_hours)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Botón de timer */}
                      <div style={{ marginLeft: '8px' }}>
                        {activeTimers[task.id] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              color: '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              {getTimerDisplay(task.id)}
                            </span>
                            <button
                              onClick={() => pauseTimer(task.id)}
                              style={{
                                padding: '2px 4px',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                              title="Pausar timer"
                            >
                              ⏸
                            </button>
                            <button
                              onClick={() => {
                                if (!task.completed) {
                                  // Solo al completar, no al descompletar
                                  const timerHours = completeTask(task.id);

                                  // Actualizar la tarea con el tiempo real
                                  const updatedTask = {
                                    ...task,
                                    completed: true,
                                    progress: 100,
                                    actual_hours: timerHours > 0 ? Math.round(timerHours * 100) / 100 : task.actual_hours
                                  };

                                  setProjects(projects.map(project => {
                                    if (project.id === selectedProject.id) {
                                      const updatedTasks = project.tasks.map(t => {
                                        if (t.id === task.id) {
                                          return updatedTask;
                                        }
                                        return t;
                                      });
                                      return { ...project, tasks: updatedTasks };
                                    }
                                    return project;
                                  }));

                                  // Sincronizar también con tareas diarias si aplica
                                  setDailyTasks(dailyTasks.map(dailyTask => {
                                    if (dailyTask.projectId === selectedProject.id && dailyTask.projectTaskId === task.id) {
                                      return { ...dailyTask, completed: true };
                                    }
                                    return dailyTask;
                                  }));
                                } else {
                                  // Descompletar tarea
                                  toggleProjectTaskCompletion(selectedProject.id, task.id, false);
                                }
                              }}
                              style={{
                                padding: '2px 4px',
                                backgroundColor: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                              title="Completar tarea"
                            >
                              ✓
                            </button>
                          </div>
                        ) : pausedTimers[task.id] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              color: '#f59e0b',
                              fontWeight: 'bold'
                            }}>
                              {getTimerDisplay(task.id)} (pausado)
                            </span>
                            <button
                              onClick={() => resumeTimer(task.id)}
                              style={{
                                padding: '2px 4px',
                                backgroundColor: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                              title="Reanudar timer"
                            >
                              ▶
                            </button>
                            <button
                              onClick={() => {
                                if (!task.completed) {
                                  // Solo al completar, no al descompletar
                                  const timerHours = completeTask(task.id);

                                  // Actualizar la tarea con el tiempo real
                                  const updatedTask = {
                                    ...task,
                                    completed: true,
                                    progress: 100,
                                    actual_hours: timerHours > 0 ? Math.round(timerHours * 100) / 100 : task.actual_hours
                                  };

                                  setProjects(projects.map(project => {
                                    if (project.id === selectedProject.id) {
                                      const updatedTasks = project.tasks.map(t => {
                                        if (t.id === task.id) {
                                          return updatedTask;
                                        }
                                        return t;
                                      });
                                      return { ...project, tasks: updatedTasks };
                                    }
                                    return project;
                                  }));

                                  // Sincronizar también con tareas diarias si aplica
                                  setDailyTasks(dailyTasks.map(dailyTask => {
                                    if (dailyTask.projectId === selectedProject.id && dailyTask.projectTaskId === task.id) {
                                      return { ...dailyTask, completed: true };
                                    }
                                    return dailyTask;
                                  }));
                                } else {
                                  // Descompletar tarea
                                  toggleProjectTaskCompletion(selectedProject.id, task.id, false);
                                }
                              }}
                              style={{
                                padding: '2px 4px',
                                backgroundColor: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                              title="Completar tarea"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startTimer(task.id)}
                            style={{
                              padding: '2px 4px',
                              backgroundColor: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                            title="Iniciar timer"
                          >
                            ▶
                          </button>
                        )}
                      </div>

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
                        setNewTaskEstimatedHours('');
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
                  <input
                    type="text"
                    value={newTaskEstimatedHours}
                    onChange={(e) => setNewTaskEstimatedHours(e.target.value)}
                    placeholder="Ej: 2h, 45min, 1h 30min, 1.5h"
                    step="0.5"
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '12px',
                      outline: 'none',
                      marginTop: '8px',
                      fontFamily: 'inherit'
                    }}
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
                        setNewTaskEstimatedHours('');
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

            {/* Resumen de tareas */}
            <div style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '15px',
              marginBottom: '15px'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center'
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
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
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
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[95vw] max-w-sm h-80 sm:h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col md:left-auto md:right-6 md:transform-none md:translate-x-0 md:w-96 md:h-96">
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


      {/* Modal de tiempo real al completar tarea */}
      {showTimeModal && completingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              ¡Tarea completada! 🎉
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>{completingTask.title}</strong>
            </p>
            {completingTask.estimated_hours && (
              <p className="text-sm text-gray-500 mb-4">
                Tiempo estimado: {formatHours(completingTask.estimated_hours)}
              </p>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuánto tiempo real te tomó? (horas)
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                placeholder="Ej: 2.5"
                defaultValue={completingTask.suggestedHours || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const actualHours = parseFloat(e.target.value);
                    if (actualHours >= 0) {
                      handleTimeSubmit(actualHours);
                    }
                  }
                }}
                id="actualTimeInput"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTimeModal(false);
                  setCompletingTask(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Omitir
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('actualTimeInput');
                  const actualHours = parseFloat(input.value);
                  if (actualHours >= 0) {
                    handleTimeSubmit(actualHours);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar tarea usando Portal */}
      {showEditTaskModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4" style={{zIndex: 99999999}}>
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar Tarea
            </h3>

            {/* Nombre de la tarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la tarea *
              </label>
              <input
                type="text"
                value={editTaskName}
                onChange={(e) => setEditTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editTaskName.trim()) {
                    saveTaskChanges();
                  }
                }}
                placeholder="Ej: Implementar funcionalidad de login"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
                placeholder="Detalles adicionales sobre la tarea..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Selector de proyecto (solo para tareas diarias) */}
            {dailyTasks.some(task => task.id === editingTask?.id) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyecto vinculado (opcional)
                </label>
                <select
                  value={editTaskProject}
                  onChange={(e) => setEditTaskProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin proyecto</option>
                  {projects.filter(p => p.status === 'activo').map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tiempo estimado */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo estimado
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={editEstimatedHours}
                    onChange={(e) => setEditEstimatedHours(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                  />
                  <p className="text-xs text-gray-500 text-center mt-1">Horas</p>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={editEstimatedMinutes}
                    onChange={(e) => setEditEstimatedMinutes(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="59"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                  />
                  <p className="text-xs text-gray-500 text-center mt-1">Minutos</p>
                </div>
              </div>
            </div>

            {/* Control de tiempo y tiempo real */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Control de tiempo
              </label>

              {/* Botones de control de timer */}
              <div className="flex gap-2 mb-4">
                {activeTimers[editingTask?.id] ? (
                  // Timer activo - mostrar tiempo y botón pausar
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-700 font-mono text-sm font-medium">
                        {getTimerDisplay(editingTask?.id)}
                      </span>
                    </div>
                    <button
                      onClick={() => pauseTimer(editingTask?.id)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      <span style={{fontSize: '14px'}}>⏸</span>
                      Pausar
                    </button>
                  </div>
                ) : pausedTimers[editingTask?.id] ? (
                  // Timer pausado - mostrar tiempo pausado y botón reanudar
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                      <span style={{fontSize: '14px'}}>⏸</span>
                      <span className="text-orange-700 font-mono text-sm font-medium">
                        {getTimerDisplay(editingTask?.id)} (pausado)
                      </span>
                    </div>
                    <button
                      onClick={() => resumeTimer(editingTask?.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <Play size={14} />
                      Reanudar
                    </button>
                  </div>
                ) : (
                  // Sin timer - botón iniciar
                  <button
                    onClick={() => startTimer(editingTask?.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Play size={14} />
                    Iniciar tarea
                  </button>
                )}
              </div>

              {/* Campos de tiempo real (editables) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Tiempo real (editable)
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={editActualHours}
                      onChange={(e) => setEditActualHours(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="99"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                    />
                    <p className="text-xs text-gray-500 text-center mt-1">Horas</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={editActualMinutes}
                      onChange={(e) => setEditActualMinutes(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="59"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                    />
                    <p className="text-xs text-gray-500 text-center mt-1">Minutos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-3">
              {/* Botón principal: Terminar Tarea */}
              {!editingTask?.completed && (
                <button
                  onClick={() => {
                    // Obtener tiempo del timer si está activo o pausado
                    let timerHours = 0;
                    if (activeTimers[editingTask.id] || pausedTimers[editingTask.id]) {
                      timerHours = completeTask(editingTask.id);
                    }

                    // Calcular tiempo real final (usar timer si existe, sino los campos editables)
                    let finalActualHours = 0;
                    if (timerHours > 0) {
                      finalActualHours = timerHours;
                    } else {
                      const actualHours = parseInt(editActualHours) || 0;
                      const actualMinutes = parseInt(editActualMinutes) || 0;
                      finalActualHours = actualHours + (actualMinutes / 60);
                    }

                    // Guardar cambios primero con el tiempo calculado
                    const estimatedHours = parseInt(editEstimatedHours) || 0;
                    const estimatedMinutes = parseInt(editEstimatedMinutes) || 0;
                    const totalEstimatedHours = estimatedHours + (estimatedMinutes / 60);

                    const updatedTask = {
                      ...editingTask,
                      title: editTaskName.trim(),
                      text: editTaskName.trim(),
                      description: editTaskDescription.trim(),
                      estimated_hours: totalEstimatedHours > 0 ? totalEstimatedHours : null,
                      actual_hours: finalActualHours > 0 ? finalActualHours : null,
                      completed: true,
                      progress: 100,
                      projectId: editTaskProject || editingTask.projectId
                    };

                    // Detectar si es una tarea diaria o de proyecto
                    const isDailyTask = dailyTasks.some(task => task.id === editingTask.id);

                    if (isDailyTask) {
                      // Actualizar tarea diaria
                      setDailyTasks(dailyTasks.map(task =>
                        task.id === editingTask.id ? updatedTask : task
                      ));
                    } else {
                      // Actualizar tarea de proyecto
                      setProjects(projects.map(project => {
                        const updatedTasks = project.tasks.map(task =>
                          task.id === editingTask.id ? updatedTask : task
                        );
                        return { ...project, tasks: updatedTasks };
                      }));

                      // Actualizar selectedProject también
                      if (selectedProject) {
                        setSelectedProject(prev => ({
                          ...prev,
                          tasks: prev.tasks.map(task =>
                            task.id === editingTask.id ? updatedTask : task
                          )
                        }));
                      }
                    }

                    closeEditTaskModal();
                  }}
                  disabled={!editTaskName.trim()}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  <span>😊 Terminar Tarea</span>
                </button>
              )}

              {/* Botones secundarios */}
              <div className="flex gap-3">
                <button
                  onClick={closeEditTaskModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTaskChanges}
                  disabled={!editTaskName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 md:left-auto md:right-6 md:transform-none md:translate-x-0 ${
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

      {/* Modal de selección de proyecto y tareas */}
      {showProjectSelectionModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
            {modalStep === 1 ? (
              /* Paso 1: Seleccionar Proyecto */
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Seleccionar Proyecto
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Para qué proyecto quieres agregar la tarea?
                </p>

                <div className="space-y-3 overflow-y-auto flex-1">
                  {/* Opción: Proyecto Personal */}
                  <button
                    onClick={() => handleProjectSelection('personal')}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📝</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Proyecto Personal</div>
                        <div className="text-sm text-gray-500">Tareas sin proyecto específico</div>
                      </div>
                    </div>
                  </button>

                  {/* Proyectos activos */}
                  {projects.filter(p => p.status === 'activo').map(project => {
                    const tasksNotInDaily = project.tasks.filter(task =>
                      !dailyTasks.some(dt => dt.projectId === project.id && dt.projectTaskId === task.id)
                    );

                    return (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelection(project.id)}
                        className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getProjectColor(project.id)}`}>
                            <span className="text-lg">📋</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 group-hover:text-blue-900">
                              {project.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tasksNotInDaily.length} tarea{tasksNotInDaily.length !== 1 ? 's' : ''} disponible{tasksNotInDaily.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {project.progress !== undefined && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-700">
                                {project.progress}%
                              </div>
                              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {projects.filter(p => p.status === 'activo').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No hay proyectos activos disponibles</p>
                      <p className="text-xs mt-1">Crea un proyecto primero para organizar tus tareas</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={resetAddTaskForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              /* Paso 2: Tareas o Crear Nueva */
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {addTaskMode === 'personal' ? '📝 Proyecto Personal' : `📋 ${projects.find(p => p.id === selectedProjectForTask)?.title}`}
                  </h3>
                  <button
                    onClick={goBackToProjectSelection}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Cambiar
                  </button>
                </div>

                {addTaskMode === 'personal' ? (
                  /* Entrada para tarea personal */
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600">
                      Describe tu tarea personal:
                    </p>
                    <input
                      type="text"
                      value={newDailyTask}
                      onChange={(e) => setNewDailyTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newDailyTask.trim()) {
                          addDailyTask();
                        }
                      }}
                      onBlur={() => {
                        if (newDailyTask.trim()) {
                          addDailyTask();
                        }
                      }}
                      placeholder="¿Qué tarea personal quieres realizar hoy?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={resetAddTaskForm}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Lista de tareas del proyecto y opción nueva */
                  <div className="flex flex-col gap-4">
                    {selectedProjectTasks.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Haz clic en una tarea para agregarla:
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedProjectTasks.map(task => (
                            <button
                              key={task.id}
                              onClick={() => addExistingProjectTask(task.id)}
                              className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-colors group"
                            >
                              <div className="font-medium text-gray-900 group-hover:text-blue-900">{task.title || task.text}</div>
                              {task.estimated_hours && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Est: {formatHours(task.estimated_hours)}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botón para nueva tarea tipo Trello */}
                    {!showNewTaskInput ? (
                      <button
                        onClick={() => setShowNewTaskInput(true)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        <span>Nueva tarea</span>
                      </button>
                    ) : (
                      <input
                        type="text"
                        value={newDailyTask}
                        onChange={(e) => setNewDailyTask(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newDailyTask.trim()) {
                            addNewTaskToProject();
                          }
                          if (e.key === 'Escape') {
                            setShowNewTaskInput(false);
                            setNewDailyTask('');
                          }
                        }}
                        onBlur={() => {
                          if (newDailyTask.trim()) {
                            addNewTaskToProject();
                          } else {
                            setShowNewTaskInput(false);
                          }
                        }}
                        placeholder="Describe la nueva tarea..."
                        className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={resetAddTaskForm}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default PersonalCoachAssistant;
