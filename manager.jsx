import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, CheckCircle, Calendar, Target, TrendingUp, Settings, Archive, Play, Trash2, Edit3, Bot, User, MessageCircle, Send, Save, CheckCircle2, Mic, MicOff, Volume2, VolumeX, LogOut, Eye, EyeOff, ChevronDown, ChevronRight, AlertCircle, Clock, RotateCcw, GripVertical, FileText, Paperclip, Image, X, Bold, Italic, List, AlignLeft, Type, Upload, Download, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Auth from './src/components/Auth';
import Landing from './src/components/Landing';
import AdminPanel from './src/components/AdminPanel';
import useAuth from './src/hooks/useAuth';
import Swal from 'sweetalert2';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

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

  /* Estilos para imágenes en markdown preview */
  .markdown-preview img {
    max-width: 300px !important;
    max-height: 200px !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin: 8px 0;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .markdown-preview img:hover {
    transform: scale(1.05);
  }

  /* Responsive: en pantallas pequeñas las imágenes son aún más pequeñas */
  @media (max-width: 768px) {
    .markdown-preview img {
      max-width: 200px !important;
      max-height: 150px !important;
    }
  }
`;
document.head.appendChild(style);

// Configuración dinámica de API
// Para endpoints regulares de API
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

// Para endpoints de autenticación
const getAuthApiBase = () => {
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

// Función para generar URLs de attachments (sin autenticación)
const getAttachmentBase = () => {
  const hostname = window.location.hostname;

  // En producción (cualquier dominio que no sea localhost)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return '/uploads';
  }

  // En desarrollo - usar variable de entorno si está disponible
  const devHost = import.meta.env.VITE_DEV_SERVER_HOST || 'localhost';
  return `http://${devHost}:3001/uploads`;
};

// Componente para elementos sorteable de tareas
const SortableTaskItem = ({ task, onToggle, onEdit, onDelete, onArchive, isUrgent, editingTaskId, editingTaskText, setEditingTaskText, saveEditedTask, cancelEditingTask, startEditingTask, onOpenTaskDetail, onUpdateProgress }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const project = task.projectId ? null : null; // Simplificado por ahora

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start p-3 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 ${
        task.completed ? 'opacity-60 bg-gray-50' : ''
      } ${isUrgent ? 'border-l-4 border-l-red-500 bg-red-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="mr-2 mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical size={16} />
      </div>

      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className={`mr-3 ${isUrgent ? 'text-red-600' : ''}`}
      />

      <div className="flex-1">
        {editingTaskId === task.id ? (
          <input
            type="text"
            value={editingTaskText}
            onChange={(e) => setEditingTaskText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') saveEditedTask();
            }}
            onBlur={saveEditedTask}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500"
            autoFocus
          />
        ) : (
          <div
            onClick={() => startEditingTask(task.id, task.text)}
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <span className={task.completed ? 'line-through text-gray-500' : ''}>
              {task.text}
            </span>
          </div>
        )}
      </div>

      {/* Progress Controls */}
      <div className="flex flex-col items-center gap-1 mr-3">
        <div className="text-xs text-gray-500 mb-1">
          Progreso
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="100"
            value={task.progress || 0}
            onChange={(e) => {
              const newProgress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
              onUpdateProgress && onUpdateProgress(task.id, newProgress);
            }}
            onClick={(e) => e.target.select()}
            onFocus={(e) => e.target.select()}
            className="w-12 px-1 py-1 text-xs border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
        {/* Progress Bar */}
        <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${task.progress || 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2">
        {editingTaskId === task.id ? (
          <button
            onClick={saveEditedTask}
            className="text-green-600 hover:text-green-800"
            title="Guardar"
          >
            <Save size={16} />
          </button>
        ) : (
          <button
            onClick={() => startEditingTask(task.id, task.text)}
            className="text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit3 size={16} />
          </button>
        )}
        <button
          onClick={() => onOpenTaskDetail(task)}
          className="text-purple-600 hover:text-purple-800"
          title="Edición Completa"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={() => onArchive(task.id)}
          className="text-green-600 hover:text-green-800"
          title="Archivar"
        >
          <Archive size={16} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-red-600 hover:text-red-800"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const PersonalCoachAssistant = () => {
  console.log("*testeoooo.jsx");

  const { user, loading: authLoading, isAuthenticated, login, logout, authenticatedFetch } = useAuth();

  const [projects, setProjects] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', priority: 'media', deadline: '', description: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [newDailyTask, setNewDailyTask] = useState('');
  const [selectedProjectForTask, setSelectedProjectForTask] = useState('');
  const [lastUsedProject, setLastUsedProject] = useState('');
  const [selectedProjectTasks, setSelectedProjectTasks] = useState([]);
  const [selectedProjectDailyTasks, setSelectedProjectDailyTasks] = useState([]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [appView, setAppView] = useState('landing'); // Forzar landing page para testing // 'landing', 'auth', 'app'
  const [userSubscription, setUserSubscription] = useState('free'); // Nuevo estado para suscripción

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
  const [isCreatingProjectForTask, setIsCreatingProjectForTask] = useState(false);
  const [isCreatingInlineProject, setIsCreatingInlineProject] = useState(false);
  const [newInlineProjectName, setNewInlineProjectName] = useState('');
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

  // Estados para timers de tareas
  const [taskTimers, setTaskTimers] = useState({});
  const [activeTimer, setActiveTimer] = useState(null);

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

  // Estados para modal de edición completa de tareas
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(true);
  const [taskDetailData, setTaskDetailData] = useState({
    description: '',
    notes: '',
    subtasks: [],
    attachments: []
  });
  const [editingInlineDescription, setEditingInlineDescription] = useState(false);
  const [editingInlineNotes, setEditingInlineNotes] = useState(false);
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
  const [voiceEnabled, setVoiceEnabled] = useState(false);
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

        // Cargar proyectos del usuario
        setProjects(data.projects || []);

        // Cargar tareas diarias del usuario
        setDailyTasks(data.dailyTasks || []);

        // Cargar información del usuario incluido el subscription_type
        if (data.user) {
          setUserSubscription(data.user.subscription_type || 'free');
        }

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

        // Cargar tareas archivadas
        const archivedResponse = await authenticatedFetch(`${getApiBase()}/assistant/archived-tasks`);
        if (archivedResponse.ok) {
          const archivedData = await archivedResponse.json();
          setArchivedTasks(archivedData);
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

  // Manejar cambio de vista cuando cambia la autenticación
  useEffect(() => {
    console.log('🔍 [ROUTING-DEBUG] isAuthenticated:', isAuthenticated);
    console.log('🔍 [ROUTING-DEBUG] authLoading:', authLoading);
    console.log('🔍 [ROUTING-DEBUG] appView:', appView);

    // Solo actualizar appView cuando ya no esté cargando
    if (!authLoading) {
      if (isAuthenticated && appView !== 'app') {
        console.log('🔄 [ROUTING] Cambiando a app (usuario autenticado)');
        setAppView('app');
      } else if (!isAuthenticated && appView === 'app') {
        console.log('🔄 [ROUTING] Cambiando a landing (usuario no autenticado)');
        setAppView('landing');
      }
    }
  }, [isAuthenticated, authLoading, appView]);

  // Cargar tareas archivadas cuando se cambie a esa vista
  useEffect(() => {
    const loadArchived = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await authenticatedFetch(`${getApiBase()}/assistant/archived-tasks`);

        if (response.ok) {
          const archived = await response.json();
          setArchivedTasks(archived);
        }
      } catch (error) {
        console.error('Error loading archived tasks:', error);
      }
    };

    if (activeView === 'archived' && isAuthenticated) {
      loadArchived();
    }
  }, [activeView, isAuthenticated]);

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

  // Efecto para establecer el proyecto por defecto cuando se abre el formulario
  useEffect(() => {
    if (showAddTaskForm && !selectedProjectForTask && lastUsedProject) {
      setSelectedProjectForTask(lastUsedProject);
    }
  }, [showAddTaskForm, lastUsedProject]);

  // Efecto para establecer proyecto por defecto basado en la última tarea creada
  useEffect(() => {
    if (dailyTasks.length > 0 && !lastUsedProject) {
      // Encontrar la tarea más reciente que tenga proyecto
      const lastTaskWithProject = dailyTasks
        .filter(task => task.projectId)
        .sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id))[0];

      if (lastTaskWithProject) {
        setLastUsedProject(lastTaskWithProject.projectId);
        if (showAddTaskForm && !selectedProjectForTask) {
          setSelectedProjectForTask(lastTaskWithProject.projectId);
        }
      }
    }
  }, [dailyTasks, showAddTaskForm]);

  // Efecto para actualizar los timers activos cada segundo
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        // Forzar re-render para actualizar el display del tiempo
        setTaskTimers(prev => ({ ...prev }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeTimer]);

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

        const response = await authenticatedFetch(`${getAuthApiBase()}/projects`, {
          method: 'POST',
          body: JSON.stringify({ project: projectData })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Actualizar estado local con el proyecto guardado
            const newProject = { ...data.project, tasks: [] };
            setProjects([...projects, newProject]);

            // Si se está creando para una tarea, seleccionarlo automáticamente
            if (isCreatingProjectForTask) {
              setSelectedProjectForTask(newProject.id);
              setIsCreatingProjectForTask(false);
            }

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

        // Si se está creando para una tarea, seleccionarlo automáticamente
        if (isCreatingProjectForTask) {
          setSelectedProjectForTask(project.id);
          setIsCreatingProjectForTask(false);
        }

        setNewProject({ title: '', priority: 'media', deadline: '', description: '' });
        setShowCreateProject(false);
      }
    }
  };

  const createInlineProject = async () => {
    if (newInlineProjectName.trim()) {
      try {
        const projectData = {
          title: newInlineProjectName.trim(),
          priority: 'media',
          deadline: '',
          description: '',
          status: 'activo',
          progress: 0,
          createdAt: new Date().toLocaleDateString(),
          tasks: []
        };

        const response = await authenticatedFetch(`${getAuthApiBase()}/projects`, {
          method: 'POST',
          body: JSON.stringify({ project: projectData })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Actualizar estado local con el proyecto guardado
            const newProject = { ...data.project, tasks: [] };
            setProjects([...projects, newProject]);
            // Seleccionar automáticamente el proyecto recién creado
            setSelectedProjectForTask(newProject.id);
            // Limpiar estado
            setNewInlineProjectName('');
            setIsCreatingInlineProject(false);
          }
        }
      } catch (error) {
        console.error('Error guardando proyecto inline:', error);
        // Fallback: guardar localmente si hay error de conexión
        const project = {
          id: Date.now(),
          title: newInlineProjectName.trim(),
          priority: 'media',
          deadline: '',
          description: '',
          status: 'activo',
          progress: 0,
          createdAt: new Date().toLocaleDateString(),
          tasks: []
        };
        setProjects([...projects, project]);
        setSelectedProjectForTask(project.id);
        setNewInlineProjectName('');
        setIsCreatingInlineProject(false);
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
      const deleteUrl = `${getAuthApiBase()}/projects/${projectId}`;
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

  const saveProjectDeadline = async () => {
    if (editingProjectDeadlineId !== null) {
      try {
        // Actualizar en la base de datos
        const response = await authenticatedFetch(`${getApiBase()}/auth/projects/${editingProjectDeadlineId}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: {
              deadline: editingProjectDeadlineText.trim() || null
            }
          })
        });

        if (response.ok) {
          // Actualizar el estado local
          setProjects(projects.map(project => {
            if (project.id === editingProjectDeadlineId) {
              return { ...project, deadline: editingProjectDeadlineText.trim() || null };
            }
            return project;
          }));
        } else {
          alert('❌ Error al actualizar la fecha límite del proyecto');
          return; // No limpiar los estados si hay error
        }
      } catch (error) {
        console.error('Error updating project deadline:', error);
        alert('❌ Error al actualizar la fecha límite del proyecto');
        return; // No limpiar los estados si hay error
      }
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

  const saveProjectTitle = async () => {
    if (editingProjectTitleId !== null && editingProjectTitleText.trim()) {
      try {
        // Actualizar en la base de datos
        const response = await authenticatedFetch(`${getApiBase()}/auth/projects/${editingProjectTitleId}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: {
              title: editingProjectTitleText.trim()
            }
          })
        });

        if (response.ok) {
          // Actualizar el estado local
          setProjects(projects.map(project => {
            if (project.id === editingProjectTitleId) {
              return { ...project, title: editingProjectTitleText.trim() };
            }
            return project;
          }));
        } else {
          alert('❌ Error al actualizar el nombre del proyecto');
          return; // No limpiar los estados si hay error
        }
      } catch (error) {
        console.error('Error updating project title:', error);
        alert('❌ Error al actualizar el nombre del proyecto');
        return; // No limpiar los estados si hay error
      }
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

  const saveProjectDescription = async () => {
    if (editingProjectDescriptionId !== null) {
      try {
        // Actualizar en la base de datos
        const response = await authenticatedFetch(`${getApiBase()}/auth/projects/${editingProjectDescriptionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            project: {
              description: editingProjectDescriptionText.trim() || null
            }
          })
        });

        if (response.ok) {
          // Actualizar el estado local
          setProjects(projects.map(project => {
            if (project.id === editingProjectDescriptionId) {
              return { ...project, description: editingProjectDescriptionText.trim() || null };
            }
            return project;
          }));
        } else {
          alert('❌ Error al actualizar la descripción del proyecto');
          return; // No limpiar los estados si hay error
        }
      } catch (error) {
        console.error('Error updating project description:', error);
        alert('❌ Error al actualizar la descripción del proyecto');
        return; // No limpiar los estados si hay error
      }
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
        const data = await response.json();
        setNewDailyTask('');
        // Guardar el proyecto usado como último proyecto
        setLastUsedProject(selectedProjectForTask);
        // No resetear selectedProjectForTask para mantenerlo por defecto

        // Recargar todos los datos para asegurar consistencia de IDs
        await loadUserData();
      } else {
        console.error('Error al guardar tarea diaria');
      }
    } catch (error) {
      console.error('Error:', error);
      // Si falla la petición, al menos actualizar localmente
      setDailyTasks([...dailyTasks, task]);
      setNewDailyTask('');
      // Guardar el proyecto usado como último proyecto
      setLastUsedProject(selectedProjectForTask);
      // No resetear selectedProjectForTask para mantenerlo por defecto
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

  const saveEditedProjectTask = async () => {
    if (editingProjectTaskText.trim()) {
      try {
        // Guardar en la base de datos
        const response = await authenticatedFetch(`${getApiBase()}/project-tasks/${editingProjectTaskId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: editingProjectTaskText.trim()
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Actualizar estado local solo si la API fue exitosa
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
        }
      } catch (error) {
        console.error('Error actualizando tarea del proyecto:', error);
        // Fallback: actualizar localmente si hay error
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

  // Funciones para timers de tareas
  const startTimer = async (taskId) => {
    // Pausar cualquier timer activo
    if (activeTimer) {
      pauseTimer(activeTimer);
    }

    // Encontrar la tarea en los proyectos para obtener su información
    let taskToAdd = null;
    let projectId = null;

    for (const project of projects) {
      const foundTask = project.tasks?.find(task => task.id === taskId);
      if (foundTask) {
        taskToAdd = foundTask;
        projectId = project.id;
        break;
      }
    }

    // Si encontramos la tarea y no está ya en las tareas diarias de hoy, agregarla
    if (taskToAdd && projectId) {
      const today = new Date().toLocaleDateString();
      const existingDailyTask = dailyTasks.find(task =>
        task.projectTaskId === taskId && task.projectId === projectId
      );

      if (!existingDailyTask) {
        try {
          const dailyTask = {
            text: taskToAdd.text || taskToAdd.title || 'Tarea sin título',
            completed: false,
            projectId: projectId,
            projectTaskId: taskId,
            createdAt: today,
            isFromProject: true
          };

          // Guardar en la base de datos
          const response = await authenticatedFetch(`${getApiBase()}/daily-tasks`, {
            method: 'POST',
            body: JSON.stringify({ task: dailyTask })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Actualizar estado local
              setDailyTasks(prev => [...prev, { ...dailyTask, id: data.task.id }]);
            }
          } else {
            // Fallback: agregar localmente si falla la BD
            setDailyTasks(prev => [...prev, { ...dailyTask, id: Date.now() }]);
          }
        } catch (error) {
          console.error('Error adding task to daily tasks:', error);
          // Fallback: agregar localmente
          const dailyTask = {
            id: Date.now(),
            text: taskToAdd.text || taskToAdd.title || 'Tarea sin título',
            completed: false,
            projectId: projectId,
            projectTaskId: taskId,
            createdAt: today,
            isFromProject: true
          };
          setDailyTasks(prev => [...prev, dailyTask]);
        }
      }
    }

    // Inicializar o reanudar el timer para esta tarea
    const currentTime = Date.now();
    setTaskTimers(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isActive: true,
        startTime: currentTime,
        totalTime: prev[taskId]?.totalTime || 0
      }
    }));
    setActiveTimer(taskId);
  };

  const pauseTimer = (taskId) => {
    const timer = taskTimers[taskId];
    if (timer && timer.isActive) {
      const currentTime = Date.now();
      const sessionTime = currentTime - timer.startTime;

      setTaskTimers(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isActive: false,
          totalTime: timer.totalTime + sessionTime,
          startTime: null
        }
      }));

      if (activeTimer === taskId) {
        setActiveTimer(null);
      }
    }
  };

  const resetTimer = (taskId) => {
    setTaskTimers(prev => ({
      ...prev,
      [taskId]: {
        isActive: false,
        totalTime: 0,
        startTime: null
      }
    }));

    if (activeTimer === taskId) {
      setActiveTimer(null);
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const getTaskElapsedTime = (taskId) => {
    const timer = taskTimers[taskId];
    if (!timer) return '0:00';

    let totalTime = timer.totalTime;
    if (timer.isActive && timer.startTime) {
      totalTime += Date.now() - timer.startTime;
    }

    return formatTime(totalTime);
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
      const completedTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);

      // Generar un mensaje más conversacional y humano
      let statusMessage = "";

      if (activeProjects.length === 0) {
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
            const deadlineDate = new Date(project.deadline);
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
          const deadlineDate = new Date(p.deadline);
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

FECHA Y HORA ACTUAL:
- Hoy es ${dateString}
- Son las ${timeString}
- Usa esta información para referencias de tiempo relativas (ej: "en una semana", "mañana", "la próxima semana", etc.)

CONTEXTO DE PROYECTOS Y PRODUCTIVIDAD:
${buildProjectContext()}

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
- USA get_projects_status SOLO cuando el usuario pregunte específicamente por un resumen general del estado (ej: "¿cómo van mis proyectos?", "muéstrame el estado de todos mis proyectos")
- Para preguntas específicas sobre datos ya mencionados en la conversación, usa el CONTEXTO PREVIO en lugar de volver a ejecutar funciones
- Sé proactivo sugiriendo acciones útiles como agregar tareas al enfoque diario

MEMORIA A LARGO PLAZO Y CONTEXTO EMOCIONAL:
${buildMemoryContext()}

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

Responde siempre en español y mantén el tono configurado.`;
  };

  // Función para formatear el historial de conversación para OpenAI
  const formatConversationHistory = () => {
    return messages
      .filter(msg => msg.type !== 'system') // Excluir mensajes del sistema si los hay
      .slice(-10) // Mantener solo los últimos 10 mensajes para eficiencia
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
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
    console.log('🚀 sendMessage ejecutándose, mensaje:', newMessage);
    if (!newMessage.trim() || isAssistantTyping) return;

    const token = localStorage.getItem('authToken');
    console.log('🔑 Token obtenido:', token ? 'SÍ' : 'NO');

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
    setIsAssistantTyping(true);

    try {
      // Llamada al asistente a través del backend
      const url = `${getApiBase()}/assistant/response`;
      console.log('🌐 Enviando petición a:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentMessage || 'Hola'
        })
      });

      if (!response.ok) {
        throw new Error(`Error del asistente: ${response.status}`);
      }

      const result = await response.json();
      let assistantResponse = result.message || result.response;
      // Las function calls ahora se manejan en el backend
      // Si hay funciones ejecutadas, ya vienen incluidas en assistantResponse

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: assistantResponse || "He procesado tu solicitud.",
        timestamp: new Date().toLocaleTimeString()
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
      console.error('❌ Error enviando mensaje:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Mensaje de error para el usuario con respuesta de demostración
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: `❌ ERROR: ${error.message}. Tu mensaje: "${currentMessage}"`,
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

  const toggleTask = async (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task) {
      const newCompleted = !task.completed;

      try {
        // Llamar al API para persistir el cambio
        // Cuando se marca como completada, también actualizar progreso al 100%
        const newProgress = newCompleted ? 100 : (task.progress || 0);

        const response = await authenticatedFetch(`${getApiBase()}/daily-tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify({
            completed: newCompleted,
            progress: newProgress
          })
        });

        if (response.ok) {
          // Solo actualizar el estado local si el API fue exitoso
          setDailyTasks(dailyTasks.map(t =>
            t.id === taskId ? { ...t, completed: newCompleted, progress: newProgress } : t
          ));

          // Sincronizar con tarea de proyecto si está vinculada
          if (task.projectId && task.projectTaskId) {
            setProjects(projects.map(project => {
              if (project.id === task.projectId) {
                const updatedTasks = project.tasks.map(pt =>
                  pt.id === task.projectTaskId ? { ...pt, completed: newCompleted } : pt
                );
                return { ...project, tasks: updatedTasks };
              }
              return project;
            }));
            updateProjectProgressFromTasks(task.projectId);
          }
        } else {
          const errorText = await response.text();
          console.error('Error updating task completion:', {
            status: response.status,
            statusText: response.statusText,
            response: errorText
          });
        }
      } catch (error) {
        console.error('Error calling API to update task:', error);
      }
    }
  };

  const deleteTask = async (taskId) => {
    // Mostrar confirmación con SweetAlert
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f9fafb',
      customClass: {
        popup: 'swal-dark-theme'
      }
    });

    // Solo proceder si el usuario confirmó
    if (result.isConfirmed) {
      try {
        // Llamar al API para eliminar la tarea de la base de datos
        const response = await authenticatedFetch(`${getApiBase()}/daily-tasks/${taskId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Solo actualizar el estado local si el API fue exitoso
          setDailyTasks(dailyTasks.filter(task => task.id !== taskId));

          // Mostrar mensaje de éxito
          Swal.fire({
            title: '¡Eliminada!',
            text: 'La tarea ha sido eliminada correctamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#f9fafb',
            customClass: {
              popup: 'swal-dark-theme'
            }
          });
        } else {
          console.error('Error deleting task from server');
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar la tarea. Inténtalo de nuevo.',
            icon: 'error',
            background: '#1f2937',
            color: '#f9fafb',
            customClass: {
              popup: 'swal-dark-theme'
            }
          });
        }
      } catch (error) {
        console.error('Error calling API to delete task:', error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al eliminar la tarea',
          icon: 'error',
          background: '#1f2937',
          color: '#f9fafb',
          customClass: {
            popup: 'swal-dark-theme'
          }
        });
      }
    }
  };

  const archiveTask = async (taskId) => {
    // Mostrar confirmación con SweetAlert
    const result = await Swal.fire({
      title: '¿Archivar tarea?',
      text: 'La tarea será movida a "Tareas Realizadas"',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f9fafb',
      customClass: {
        popup: 'swal-dark-theme'
      }
    });

    if (result.isConfirmed) {
      try {
        // Llamar al API para archivar la tarea
        const response = await authenticatedFetch(`${getApiBase()}/assistant/task/${taskId}/archive`, {
          method: 'PUT'
        });

        if (response.ok) {
          // Recargar datos para mantener consistencia
          await loadUserData();

          // Mostrar mensaje de éxito
          Swal.fire({
            title: '¡Archivada!',
            text: 'La tarea ha sido archivada correctamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#f9fafb',
            customClass: {
              popup: 'swal-dark-theme'
            }
          });
        } else {
          const errorText = await response.text();
          console.error('Error archiving task from server:', {
            status: response.status,
            statusText: response.statusText,
            response: errorText
          });
          Swal.fire({
            title: 'Error',
            text: 'No se pudo archivar la tarea. Inténtalo de nuevo.',
            icon: 'error',
            background: '#1f2937',
            color: '#f9fafb',
            customClass: {
              popup: 'swal-dark-theme'
            }
          });
        }
      } catch (error) {
        console.error('Error calling API to archive task:', error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al archivar la tarea',
          icon: 'error',
          background: '#1f2937',
          color: '#f9fafb',
          customClass: {
            popup: 'swal-dark-theme'
          }
        });
      }
    }
  };

  const unarchiveTask = async (taskId) => {
    // Mostrar confirmación con SweetAlert
    const result = await Swal.fire({
      title: '¿Deshacer tarea?',
      text: 'La tarea volverá a "Tareas Pendientes"',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, deshacer',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f9fafb',
      customClass: {
        popup: 'swal-dark-theme'
      }
    });

    if (result.isConfirmed) {
      try {
        // Llamar al API para desarchiver la tarea
        const response = await authenticatedFetch(`${getApiBase()}/assistant/task/${taskId}/unarchive`, {
          method: 'PUT'
        });

        if (response.ok) {
          // Recargar datos para mantener consistencia
          await loadUserData();

          // Mostrar mensaje de éxito
          Swal.fire({
            title: '¡Tarea restaurada!',
            text: 'La tarea ha sido movida de vuelta a pendientes',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#f9fafb',
            customClass: {
              popup: 'swal-dark-theme'
            }
          });
        } else {
          const errorText = await response.text();
          console.error('Error unarchiving task from server:', {
            status: response.status,
            statusText: response.statusText,
            response: errorText
          });
          Swal.fire({
            title: 'Error',
            text: 'No se pudo restaurar la tarea. Inténtalo de nuevo.',
            icon: 'error',
            background: '#1f2937',
            color: '#f9fafb',
            customClass: {
              popup: 'swal-dark-theme'
            }
          });
        }
      } catch (error) {
        console.error('Error calling API to unarchive task:', error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al restaurar la tarea',
          icon: 'error',
          background: '#1f2937',
          color: '#f9fafb',
          customClass: {
            popup: 'swal-dark-theme'
          }
        });
      }
    }
  };

  const updateDailyTaskProgress = async (taskId, progress) => {
    try {
      console.log('🔄 Actualizando progreso de tarea:', { taskId, progress });

      const response = await authenticatedFetch(`${getApiBase()}/daily-tasks/${taskId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ progress })
      });

      if (response.ok) {
        const data = await response.json();

        // Actualizar estado local
        setDailyTasks(dailyTasks.map(task =>
          task.id === taskId ? {
            ...task,
            progress: progress,
            completed: progress === 100
          } : task
        ));

        console.log('✅ Progreso actualizado exitosamente');
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error actualizando progreso de tarea:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el progreso de la tarea',
        icon: 'error',
        background: '#1f2937',
        color: '#f9fafb',
        customClass: {
          popup: 'swal-dark-theme'
        }
      });
    }
  };

  const startEditingTask = (taskId, taskText) => {
    setEditingTaskId(taskId);
    setEditingTaskText(taskText);
  };

  const saveEditedTask = async () => {
    if (editingTaskText.trim()) {
      try {
        // Guardar en la base de datos
        const response = await authenticatedFetch(`${getApiBase()}/daily-tasks/${editingTaskId}`, {
          method: 'PUT',
          body: JSON.stringify({
            text: editingTaskText.trim()
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Actualizar estado local solo si la API fue exitosa
            setDailyTasks(dailyTasks.map(task =>
              task.id === editingTaskId ? { ...task, text: editingTaskText.trim() } : task
            ));
          }
        }
      } catch (error) {
        console.error('Error actualizando tarea diaria:', error);
        // Fallback: actualizar localmente si hay error
        setDailyTasks(dailyTasks.map(task =>
          task.id === editingTaskId ? { ...task, text: editingTaskText.trim() } : task
        ));
      }
    }
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  // ===================== FUNCIONES PARA MODAL DE EDICIÓN COMPLETA =====================

  // Abrir modal de edición completa de tarea
  const openTaskDetailModal = async (task) => {
    try {
      setSelectedTaskForDetail(task);
      setShowTaskDetailModal(true);

      console.log('📋 [MODAL] Cargando detalles de tarea:', task.id);

      // Cargar detalles existentes si los hay
      const response = await authenticatedFetch(`${getApiBase()}/task-details/${task.id}`);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          setTaskDetailData({
            description: data.data.description || '',
            notes: data.data.notes || '',
            subtasks: data.data.subtasks || [],
            attachments: data.data.attachments || []
          });
        } else {
          // Si no hay detalles, inicializar vacío
          setTaskDetailData({
            description: '',
            notes: '',
            subtasks: [],
            attachments: []
          });
        }
      }

    } catch (error) {
      console.error('Error cargando detalles de tarea:', error);
      setTaskDetailData({
        description: '',
        notes: '',
        subtasks: [],
        attachments: []
      });
    }
  };

  // Cerrar modal
  const closeTaskDetailModal = () => {
    setShowTaskDetailModal(false);
    setSelectedTaskForDetail(null);
    setTaskDetailData({
      description: '',
      notes: '',
      subtasks: [],
      attachments: []
    });
  };

  // Guardar detalles de tarea
  const saveTaskDetails = async () => {
    if (!selectedTaskForDetail) return;

    try {
      const response = await authenticatedFetch(`${getApiBase()}/task-details/${selectedTaskForDetail.id}`, {
        method: 'POST',
        body: JSON.stringify({
          description: taskDetailData.description,
          notes: taskDetailData.notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Recargar todos los detalles de la tarea para mantener sincronización
          const detailsResponse = await authenticatedFetch(`${getApiBase()}/task-details/${selectedTaskForDetail.id}`);
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            if (detailsData.success && detailsData.data) {
              setTaskDetailData({
                description: detailsData.data.description || '',
                notes: detailsData.data.notes || '',
                subtasks: detailsData.data.subtasks || [],
                attachments: detailsData.data.attachments || []
              });
            }
          }

          Swal.fire({
            title: '¡Guardado!',
            text: 'Los detalles de la tarea se guardaron correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#f9fafb'
          });
        }
      }

    } catch (error) {
      console.error('Error guardando detalles:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron guardar los detalles',
        icon: 'error',
        background: '#1f2937',
        color: '#f9fafb'
      });
    }
  };

  // Agregar subtarea
  const addSubtask = async () => {
    if (!selectedTaskForDetail) return;

    const newSubtaskText = prompt('Ingresa el texto de la nueva subtarea:');
    if (!newSubtaskText?.trim()) return;

    try {
      const response = await authenticatedFetch(`${getApiBase()}/task-details/${selectedTaskForDetail.id}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({
          text: newSubtaskText.trim(),
          order_index: taskDetailData.subtasks.length
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTaskDetailData(prev => ({
            ...prev,
            subtasks: [...prev.subtasks, {
              id: data.id,
              text: newSubtaskText.trim(),
              completed: false,
              order_index: prev.subtasks.length
            }]
          }));
        }
      }

    } catch (error) {
      console.error('Error agregando subtarea:', error);
    }
  };

  // Actualizar subtarea
  const updateSubtask = async (subtaskId, updates) => {
    try {
      const response = await authenticatedFetch(`${getApiBase()}/subtasks/${subtaskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setTaskDetailData(prev => ({
          ...prev,
          subtasks: prev.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
          )
        }));
      }

    } catch (error) {
      console.error('Error actualizando subtarea:', error);
    }
  };

  // Eliminar subtarea
  const deleteSubtask = async (subtaskId) => {
    try {
      const response = await authenticatedFetch(`${getApiBase()}/subtasks/${subtaskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTaskDetailData(prev => ({
          ...prev,
          subtasks: prev.subtasks.filter(subtask => subtask.id !== subtaskId)
        }));
      }

    } catch (error) {
      console.error('Error eliminando subtarea:', error);
    }
  };

  // Manejar pegar imágenes en el editor
  const handlePasteImage = async (event) => {
    const items = event.clipboardData.items;

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();

        const file = item.getAsFile();
        const formData = new FormData();
        formData.append('files', file);

        try {
          // Usar fetch directamente en lugar de authenticatedFetch para FormData
          const token = localStorage.getItem('authToken');
          const response = await fetch(`${getApiBase()}/task-details/${selectedTaskForDetail.id}/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Agregar la imagen al contenido del editor
              const imageUrl = `${getAttachmentBase()}/${data.files[0].file.filename}`;
              const imageMarkdown = `![${data.files[0].file.original_name}](${imageUrl})`;

              setTaskDetailData(prev => ({
                ...prev,
                description: prev.description + '\n\n' + imageMarkdown,
                attachments: [...prev.attachments, data.files[0].file]
              }));
            }
          }

        } catch (error) {
          console.error('Error subiendo imagen pegada:', error);
        }
      }
    }
  };

  // Funciones de formateo de texto para el editor
  const insertFormatting = (format) => {
    const textarea = document.querySelector('#description-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeSelection = textarea.value.substring(0, start);
    const afterSelection = textarea.value.substring(end);

    let formattedText = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = '**texto en negrita**';
          newCursorPos = start + 2; // Posicionar cursor dentro de los asteriscos
        }
        break;

      case 'italic':
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = '*texto en cursiva*';
          newCursorPos = start + 1;
        }
        break;

      case 'list':
        const lines = selectedText.split('\n');
        if (selectedText) {
          formattedText = lines.map(line => line.trim() ? `- ${line.trim()}` : line).join('\n');
        } else {
          formattedText = '- Elemento de lista\n- Otro elemento';
          newCursorPos = start + 2;
        }
        break;

      case 'heading':
        if (selectedText) {
          formattedText = `## ${selectedText}`;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = '## Título';
          newCursorPos = start + 3;
        }
        break;

      default:
        return;
    }

    const newValue = beforeSelection + formattedText + afterSelection;

    // Actualizar el estado
    setTaskDetailData(prev => ({
      ...prev,
      description: newValue
    }));

    // Enfocar y posicionar cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Insertar imagen desde botón
  const insertImageFromButton = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async (e) => {
      if (!selectedTaskForDetail || !e.target.files.length) return;

      const formData = new FormData();
      for (const file of e.target.files) {
        formData.append('files', file);
      }

      try {
        // Usar fetch directamente en lugar de authenticatedFetch para FormData
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${getApiBase()}/task-details/${selectedTaskForDetail.id}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Insertar markdown de imagen en el cursor
            const textarea = document.querySelector('#description-editor');
            const cursorPos = textarea ? textarea.selectionStart : 0;

            const imageMarkdowns = data.files.map(fileData => {
              const imageUrl = `${getAttachmentBase()}/${fileData.file.filename}`;
              return `![${fileData.file.original_name}](${imageUrl})`;
            }).join('\n\n');

            const beforeCursor = taskDetailData.description.substring(0, cursorPos);
            const afterCursor = taskDetailData.description.substring(cursorPos);
            const newContent = beforeCursor + '\n\n' + imageMarkdowns + '\n\n' + afterCursor;

            setTaskDetailData(prev => ({
              ...prev,
              description: newContent,
              attachments: [...prev.attachments, ...data.files.map(f => f.file)]
            }));

            // Posicionar cursor después de las imágenes
            setTimeout(() => {
              if (textarea) {
                const newPos = cursorPos + imageMarkdowns.length + 4;
                textarea.focus();
                textarea.setSelectionRange(newPos, newPos);
              }
            }, 0);
          }
        }
      } catch (error) {
        console.error('Error subiendo imagen:', error);
      }
    };

    input.click();
  };

  // Insertar archivo desde botón
  const insertFileFromButton = () => {
    const input = document.querySelector('input[type="file"][multiple]');
    if (input) {
      input.click();
    }
  };

  // Funciones para edición WYSIWYG con contentEditable
  const handleDescriptionClick = () => {
    setEditingInlineDescription(true);
  };

  const handleNotesClick = () => {
    setEditingInlineNotes(true);
  };

  const handleDescriptionBlur = (e) => {
    setEditingInlineDescription(false);
    // Convertir HTML a markdown para mantener compatibilidad
    const htmlContent = e.target.innerHTML;
    const markdownContent = htmlToMarkdown(htmlContent);
    setTaskDetailData(prev => ({ ...prev, description: markdownContent }));
  };

  const handleNotesBlur = (e) => {
    setEditingInlineNotes(false);
    // Convertir HTML a markdown para mantener compatibilidad
    const htmlContent = e.target.innerHTML;
    const markdownContent = htmlToMarkdown(htmlContent);
    setTaskDetailData(prev => ({ ...prev, notes: markdownContent }));
  };

  // Manejar pegar imágenes en editores WYSIWYG contentEditable
  const handleWysiwygPasteImage = async (event, field) => {
    const items = event.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.startsWith('image/')) {
        event.preventDefault();

        const file = item.getAsFile();
        if (!file) continue;

        const formData = new FormData();
        formData.append('files', file);

        try {
          console.log('Subiendo imagen...');
          const response = await fetch(`${getApiBase()}/upload.php`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Insertar imagen en el editor contentEditable
              const imageUrl = `${getApiBase()}/uploads/${data.files[0].file.filename}`;
              const imgElement = document.createElement('img');
              imgElement.src = imageUrl;
              imgElement.alt = data.files[0].file.original_name;
              imgElement.className = 'wysiwyg-image';
              imgElement.style.cssText = 'max-width: 300px; max-height: 200px; object-fit: contain; border-radius: 8px; margin: 8px 0; cursor: pointer;';

              // Insertar imagen en la posición del cursor
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(imgElement);

                // Mover cursor después de la imagen
                range.setStartAfter(imgElement);
                range.setEndAfter(imgElement);
                selection.removeAllRanges();
                selection.addRange(range);
              }

              // No convertir a markdown inmediatamente, dejar que se mantenga como HTML
              // La conversión se hará cuando el usuario salga del editor (onBlur)

              console.log('Imagen subida correctamente');
            } else {
              console.error('Error al subir imagen:', data.message || 'Error desconocido');
            }
          } else {
            console.error('Error al subir imagen');
          }
        } catch (error) {
          console.error('Error al subir imagen:', error);
        }
        break;
      }
    }
  };

  // Convertir HTML básico a markdown
  const htmlToMarkdown = (html) => {
    return html
      .replace(/<div><br><\/div>/g, '\n')
      .replace(/<div>(.*?)<\/div>/g, '\n$1')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
      .replace(/<img[^>]+src="([^"]*)"[^>]*>/g, '![]($1)')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  // Convertir markdown a HTML para contentEditable
  const markdownToHtml = (markdown) => {
    if (!markdown) return '';

    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="wysiwyg-image" style="max-width: 300px; max-height: 200px; object-fit: contain; border-radius: 8px; margin: 8px 0; cursor: pointer;" />')
      .replace(/\n/g, '<br>');
  };

  // Efecto para manejar clics en imágenes dentro de contentEditable
  useEffect(() => {
    const handleImageClick = (e) => {
      if (e.target.classList.contains('wysiwyg-image')) {
        e.preventDefault();
        e.stopPropagation();

        // Crear modal para ver imagen en tamaño completo
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = e.target.src;
        img.alt = e.target.alt;
        img.style.cssText = `
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
        `;

        modal.appendChild(img);
        modal.onclick = () => document.body.removeChild(modal);
        document.body.appendChild(modal);
      }
    };

    document.addEventListener('click', handleImageClick);
    return () => document.removeEventListener('click', handleImageClick);
  }, []);

  // ===================== FIN FUNCIONES MODAL DE EDICIÓN =====================

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Función para manejar el final del drag and drop
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = dailyTasks.findIndex((task) => task.id === active.id);
      const newIndex = dailyTasks.findIndex((task) => task.id === over?.id);

      const reorderedTasks = arrayMove(dailyTasks, oldIndex, newIndex);

      // Actualizar estado local inmediatamente
      setDailyTasks(reorderedTasks);

      // Enviar nuevo orden al servidor
      try {
        const orderedTaskIds = reorderedTasks.map((task, index) => ({
          id: task.id,
          order: index
        }));

        const response = await authenticatedFetch(`${getApiBase()}/daily-tasks-reorder`, {
          method: 'PUT',
          body: JSON.stringify({ tasks: orderedTaskIds })
        });

        if (!response.ok) {
          console.error('Error actualizando orden de tareas');
          // Revertir en caso de error
          setDailyTasks(dailyTasks);
        }
      } catch (error) {
        console.error('Error enviando nuevo orden:', error);
        // Revertir en caso de error
        setDailyTasks(dailyTasks);
      }
    }
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
      const deadline = new Date(project.deadline);
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

        {/* Timer display for project tasks */}
        {task.isFromProject && task.projectTaskId && (
          <div className="flex items-center gap-2 mr-2">
            <span style={{
              fontSize: '12px',
              color: taskTimers[task.projectTaskId]?.isActive ? '#3b82f6' : '#6b7280',
              fontWeight: taskTimers[task.projectTaskId]?.isActive ? 'bold' : 'normal',
              minWidth: '45px',
              padding: '2px 6px',
              backgroundColor: taskTimers[task.projectTaskId]?.isActive ? '#dbeafe' : '#f3f4f6',
              borderRadius: '4px',
              border: taskTimers[task.projectTaskId]?.isActive ? '1px solid #3b82f6' : '1px solid #d1d5db'
            }}>
              ⏰ {getTaskElapsedTime(task.projectTaskId)}
            </span>
          </div>
        )}

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
                onClick={() => archiveTask(task.id)}
                className="text-green-500 hover:text-green-700 hover:bg-green-50 p-1 rounded"
                title="Archivar tarea"
              >
                <Archive size={16} />
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
                className={`${
                  isPremiumUser()
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                } text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 md:space-x-2 text-xs md:text-sm ml-2 md:ml-0`}
                title={isPremiumUser() ? "Asistente IA" : "Funcionalidad Premium"}
              >
                <Bot size={14} />
                <span className="hidden sm:inline">{isPremiumUser() ? 'IA' : '⭐ IA'}</span>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={dailyTasks.map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 md:space-y-3">
                      {dailyTasks.map(task => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onToggle={toggleTask}
                          onDelete={deleteTask}
                          onArchive={archiveTask}
                          isUrgent={false}
                          editingTaskId={editingTaskId}
                          editingTaskText={editingTaskText}
                          setEditingTaskText={setEditingTaskText}
                          saveEditedTask={saveEditedTask}
                          cancelEditingTask={cancelEditingTask}
                          startEditingTask={startEditingTask}
                          onOpenTaskDetail={openTaskDetailModal}
                          onUpdateProgress={updateDailyTaskProgress}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
                  <div className="flex flex-col gap-3">
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    {/* Selección de proyecto inline */}
                    <div className="space-y-2 mb-3">
                      <label className="text-sm text-gray-600 font-medium">Proyecto:</label>
                      <div className="flex flex-wrap gap-2">
                        {/* Opción para tareas independientes */}
                        <button
                          onClick={() => setSelectedProjectForTask('')}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            !selectedProjectForTask
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          Tareas Independientes
                        </button>

                        {/* Lista de proyectos existentes */}
                        {projects.map(project => (
                          <button
                            key={project.id}
                            onClick={() => setSelectedProjectForTask(project.id)}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              selectedProjectForTask === project.id
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {project.name || project.title}
                          </button>
                        ))}

                        {/* Botón o campo para crear nuevo proyecto */}
                        {isCreatingInlineProject ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newInlineProjectName}
                              onChange={(e) => setNewInlineProjectName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  createInlineProject();
                                }
                              }}
                              placeholder="Nombre del proyecto"
                              className="px-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={createInlineProject}
                              className="px-2 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setIsCreatingInlineProject(false);
                                setNewInlineProjectName('');
                              }}
                              className="px-2 py-1.5 text-sm bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsCreatingInlineProject(true)}
                            className="px-3 py-1.5 text-sm border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center gap-1"
                          >
                            <Plus size={14} />
                            Crear proyecto
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex gap-2 sm:gap-1">
                        <button
                          onClick={() => {
                            addDailyTask();
                            setShowAddTaskForm(false);
                          }}
                          className="flex-1 sm:flex-none bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 text-sm font-medium"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setShowAddTaskForm(false);
                            setNewDailyTask('');
                            setSelectedProjectForTask(lastUsedProject);
                          }}
                          className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2.5 rounded-lg hover:bg-gray-600 text-sm font-medium"
                        >
                          ✕
                        </button>
                      </div>
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
                  className={`w-full text-left p-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${
                    isPremiumUser()
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-amber-700 hover:bg-amber-50 bg-amber-50/50 border border-amber-200'
                  }`}
                  title={isPremiumUser() ? "Consultar IA" : "Funcionalidad Premium"}
                >
                  <Bot size={14} />
                  <span>{isPremiumUser() ? 'Consultar IA' : '⭐ Consultar IA (Premium)'}</span>
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
                                    {new Date(project.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Card para Tareas Independientes */}
                        <div
                          onClick={() => {
                            // Crear proyecto virtual para tareas independientes
                            const independentTasks = dailyTasks.filter(task => !task.project_id && !task.projectId);
                            const virtualProject = {
                              id: 'independent-tasks',
                              title: 'Tareas Independientes',
                              description: 'Tareas personales que no pertenecen a ningún proyecto específico',
                              status: 'activo',
                              priority: 'media',
                              tasks: independentTasks.map(task => ({
                                id: task.id,
                                title: task.text,
                                completed: task.completed,
                                createdAt: task.created_at || task.createdAt
                              })),
                              progress: independentTasks.length > 0
                                ? Math.round((independentTasks.filter(t => t.completed).length / independentTasks.length) * 100)
                                : 0
                            };
                            setSelectedProject(virtualProject);
                            setShowProjectDetailModal(true);
                          }}
                          className={`rounded-lg p-6 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-100 ${
                            currentTheme === 'minimal' || currentTheme === 'brutalist'
                              ? 'bg-purple-100 shadow-sm hover:shadow-lg'
                              : 'bg-purple-100 shadow-lg backdrop-blur-none hover:shadow-2xl'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 text-sm">📝</span>
                                </div>
                                Tareas Independientes
                              </h3>
                              <div className="flex items-center space-x-3 text-sm">
                                <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-purple-100 text-purple-800">
                                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                  Personal
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-purple-700 text-sm mb-4">
                            Tareas personales que no pertenecen a ningún proyecto específico
                          </p>

                          {/* Stats */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-purple-600">Tareas:</span>
                              <span className="font-medium text-purple-900">
                                {`${dailyTasks.filter(task => (!task.project_id && !task.projectId) && task.completed).length} / ${dailyTasks.filter(task => !task.project_id && !task.projectId).length}`}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-purple-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300 bg-purple-500"
                                style={{
                                  width: `${dailyTasks.filter(task => !task.project_id && !task.projectId).length > 0
                                    ? Math.round((dailyTasks.filter(task => (!task.project_id && !task.projectId) && task.completed).length / dailyTasks.filter(task => !task.project_id && !task.projectId).length) * 100)
                                    : 0}%`,
                                }}
                              ></div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                              <span className="text-purple-600">Progreso:</span>
                              <span className="font-medium text-purple-900">
                                {dailyTasks.filter(task => !task.project_id && !task.projectId).length > 0
                                  ? Math.round((dailyTasks.filter(task => (!task.project_id && !task.projectId) && task.completed).length / dailyTasks.filter(task => !task.project_id && !task.projectId).length) * 100)
                                  : 0}%
                              </span>
                            </div>
                          </div>
                        </div>

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
      if (showUserDropdown && !event.target.closest('.user-dropdown') && !event.target.closest('.user-button')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  // Función para verificar si el usuario es premium
  const isPremiumUser = () => {
    return userSubscription === 'premium';
  };

  // Función para renderizar mensaje de premium requerido
  const renderPremiumRequired = () => {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Bot size={32} className="text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            🌟 Funcionalidad Premium
          </h3>
          <p className="text-gray-600 mb-4">
            El asistente personal está disponible solo para usuarios Premium.
            Actualiza tu plan para acceder a esta increíble funcionalidad.
          </p>
          <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
            <h4 className="font-semibold text-gray-800 mb-2">Con Premium obtienes:</h4>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>🤖 Asistente personal con IA</li>
              <li>🎯 Análisis de proyectos personalizado</li>
              <li>📊 Optimización de tareas inteligente</li>
              <li>🗣️ Interacciones por voz</li>
              <li>🧠 Memoria conversacional avanzada</li>
            </ul>
          </div>
          <div className="text-sm text-gray-500">
            Plan actual: <span className="font-semibold capitalize">{userSubscription}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAssistantView = () => {
    // Si el usuario no es premium, mostrar el mensaje
    if (!isPremiumUser()) {
      return renderPremiumRequired();
    }
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
                          <div
                            className="space-y-1 max-h-24 overflow-y-auto text-xs pr-1 border border-gray-200 rounded-md px-2 py-1 bg-white"
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
            <div className={`transition-all duration-300 ${showConfigPanel ? 'flex-1' : 'w-full'} flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 rounded-xl shadow-2xl border border-indigo-100`}>
              {/* Mensajes del chat */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">¡Hola! Soy {assistantConfig.assistantName}</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Estoy aquí para ayudarte con tus proyectos, responder preguntas y hacer tu trabajo más eficiente.
                      ¡Pregúntame lo que necesites!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8 max-w-2xl mx-auto">
                      <button
                        onClick={() => setNewMessage(`Analiza mis ${projects.length} proyectos y dime cuáles necesitan más atención`)}
                        className="p-3 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 text-sm text-gray-700 hover:text-indigo-700"
                      >
                        💼 Análisis de proyectos ({projects.length})
                      </button>
                      <button
                        onClick={() => {
                          const pendingTasks = projects.reduce((total, project) =>
                            total + (project.tasks?.filter(task => !task.completed).length || 0), 0
                          );
                          setNewMessage(`Tengo ${pendingTasks} tareas pendientes. ¿Cómo puedo priorizarlas mejor?`);
                        }}
                        className="p-3 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 text-sm text-gray-700 hover:text-indigo-700"
                      >
                        ✅ Optimizar tareas pendientes
                      </button>
                      <button
                        onClick={() => {
                          const currentHour = new Date().getHours();
                          const timeBasedPrompt = currentHour < 12
                            ? 'Dame una estrategia productiva para empezar bien el día'
                            : currentHour < 18
                            ? 'Necesito mantener el foco y energía para la tarde'
                            : 'Ayúdame a planificar el día de mañana y cerrar bien hoy';
                          setNewMessage(timeBasedPrompt);
                        }}
                        className="p-3 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 text-sm text-gray-700 hover:text-indigo-700"
                      >
                        🚀 Coaching personalizado
                      </button>
                    </div>

                    {/* Additional contextual suggestions */}
                    {projects.length > 0 && (
                      <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-2">💡 Sugerencias inteligentes</h4>
                        <div className="space-y-2">
                          {projects.filter(p => p.status === 'active').length > 0 && (
                            <button
                              onClick={() => setNewMessage(`¿Cómo puedo mejorar la eficiencia en mis proyectos activos: ${projects.filter(p => p.status === 'active').map(p => p.title).join(', ')}?`)}
                              className="block w-full text-left text-sm text-indigo-700 hover:text-indigo-900 p-2 rounded hover:bg-indigo-100 transition-colors"
                            >
                              📈 Optimizar proyectos activos
                            </button>
                          )}
                          {projects.some(p => p.tasks?.some(t => !t.completed)) && (
                            <button
                              onClick={() => setNewMessage('Ayúdame a crear un plan de acción para completar las tareas más importantes de esta semana')}
                              className="block w-full text-left text-sm text-indigo-700 hover:text-indigo-900 p-2 rounded hover:bg-indigo-100 transition-colors"
                            >
                              🎯 Plan de acción semanal
                            </button>
                          )}
                          <button
                            onClick={() => setNewMessage('Basándote en mi histórico de productividad, ¿qué hábitos debería desarrollar para ser más eficiente?')}
                            className="block w-full text-left text-sm text-indigo-700 hover:text-indigo-900 p-2 rounded hover:bg-indigo-100 transition-colors"
                          >
                            🌱 Desarrollo de hábitos
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`w-full animate-fadeIn ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`relative px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ml-8'
                            : 'bg-white/90 border border-gray-100 mr-8'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`absolute -top-2 ${message.type === 'user' ? '-right-2' : '-left-2'} w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-pink-400 to-purple-500'
                            : 'bg-gradient-to-r from-indigo-400 to-blue-500'
                        }`}>
                          {message.type === 'assistant' ? (
                            <Bot size={16} className="text-white" />
                          ) : (
                            <User size={16} className="text-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pt-2">
                          {message.type === 'assistant' ? (
                            <div className="text-gray-800 leading-relaxed">
                              <ReactMarkdown
                                components={{
                                  p: ({children}) => <p className="mb-3 last:mb-0 text-sm leading-7">{children}</p>,
                                  ul: ({children}) => <ul className="mb-3 pl-5 space-y-2 list-disc marker:text-indigo-400">{children}</ul>,
                                  ol: ({children}) => <ol className="mb-3 pl-5 space-y-2 list-decimal marker:text-indigo-400">{children}</ol>,
                                  li: ({children}) => <li className="text-sm text-gray-700 leading-6">{children}</li>,
                                  h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-gray-900">{children}</h3>,
                                  strong: ({children}) => <strong className="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">{children}</strong>,
                                  em: ({children}) => <em className="italic text-indigo-600">{children}</em>,
                                  code: ({children}) => <code className="bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-xs font-mono text-gray-800">{children}</code>,
                                  blockquote: ({children}) => <blockquote className="border-l-4 border-indigo-300 pl-4 mb-3 italic text-gray-700 bg-indigo-50 py-2 rounded-r-lg">{children}</blockquote>,
                                  br: () => <br className="mb-2" />
                                }}
                              >
                                {message.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                          )}

                          {/* Timestamp */}
                          <div className={`text-xs mt-3 pt-2 border-t ${
                            message.type === 'user'
                              ? 'text-indigo-100 border-indigo-400/30'
                              : 'text-gray-400 border-gray-200'
                          } flex items-center justify-between`}>
                            <span>{message.timestamp}</span>
                            {message.type === 'assistant' && (
                              <span className="text-indigo-500 font-medium text-xs">{assistantConfig.assistantName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de que el asistente está escribiendo */}
                {isAssistantTyping && (
                  <div className="w-full flex justify-start animate-fadeIn">
                    <div className="max-w-[85%] mr-8">
                      <div className="relative px-6 py-4 bg-white/90 border border-gray-100 rounded-2xl shadow-lg backdrop-blur-sm">
                        {/* Avatar */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg">
                          <Bot size={16} className="text-white" />
                        </div>

                        <div className="pt-2 flex items-center space-x-3">
                          <span className="text-sm text-gray-600 font-medium">{assistantConfig.assistantName} está escribiendo</span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                            <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>

              {/* Input para nuevo mensaje */}
              <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gradient-to-r from-white via-indigo-50/30 to-white backdrop-blur-sm">
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

                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isListening ? 'Escuchando... (Haz una pausa de 2 segundos para terminar)' : `💬 Pregúntale algo a ${assistantConfig.assistantName}...`}
                      className={`w-full p-4 border-2 rounded-2xl focus:outline-none focus:border-transparent text-sm transition-all duration-200 shadow-sm ${
                        isListening
                          ? 'border-red-300 focus:ring-4 focus:ring-red-500/20 bg-red-50'
                          : 'border-gray-200 focus:ring-4 focus:ring-indigo-500/20 bg-white hover:border-indigo-300'
                      } ${isAssistantTyping ? 'opacity-50' : ''}`}
                      disabled={isAssistantTyping}
                    />
                    {newMessage.trim() && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          {newMessage.length}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isAssistantTyping}
                    className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center space-x-2"
                    title="Enviar mensaje"
                  >
                    <Send size={18} />
                    <span className="font-medium hidden sm:block">Enviar</span>
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
  const themeStyles = getThemeStyles(currentTheme);
  const headerStyles = getHeaderStyles(currentTheme);

  console.log('🚀 [RENDER-DEBUG] authLoading:', authLoading);
  console.log('🚀 [RENDER-DEBUG] isAuthenticated:', isAuthenticated);
  console.log('🚀 [RENDER-DEBUG] appView:', appView);
  console.log('🚀 [RENDER-DEBUG] user:', user);

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    console.log('📱 [RENDER] Mostrando loading screen');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">∞</span>
          </div>
          <p className="text-white text-xl">Iniciando SmartChatix...</p>
        </div>
      </div>
    );
  }

  // Landing Page para usuarios no autenticados
  if (!isAuthenticated && appView === 'landing') {
    console.log('🌟 [RENDER] Mostrando Landing Page');
    return (
      <Landing
        onNavigate={(view) => {
          console.log('🔄 [NAVIGATION] Landing página navegando a:', view);
          if (view === 'login' || view === 'register') {
            setAppView('auth');
          }
        }}
      />
    );
  }

  // Auth Component para login/registro
  if (!isAuthenticated && appView === 'auth') {
    return (
      <Auth
        onSuccess={() => setAppView('app')}
        onBack={() => setAppView('landing')}
      />
    );
  }

  const renderArchivedTasksView = () => {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tareas Realizadas</h2>
            <div className="text-sm text-gray-500">
              Total: {archivedTasks.length} tarea{archivedTasks.length !== 1 ? 's' : ''} archivada{archivedTasks.length !== 1 ? 's' : ''}
            </div>
          </div>

          {archivedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Archive size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tareas archivadas</h3>
              <p className="text-gray-500">Las tareas que archives aparecerán aquí con su fecha de finalización.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium">{task.text}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>
                            Iniciada: {task.started_at ? new Date(task.started_at).toLocaleString('es-ES') : 'No disponible'}
                          </span>
                          <span>
                            Archivada: {task.completed_at ? new Date(task.completed_at).toLocaleString('es-ES') : 'No disponible'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => unarchiveTask(task.id)}
                      className="ml-3 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 flex-shrink-0"
                      title="Deshacer tarea"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  console.log('🚀 [RENDER-DEBUG] authLoading:', authLoading);
  console.log('🚀 [RENDER-DEBUG] isAuthenticated:', isAuthenticated);
  console.log('🚀 [RENDER-DEBUG] appView:', appView);
  console.log('🚀 [RENDER-DEBUG] user:', user);

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    console.log('📱 [RENDER] Mostrando loading screen');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">∞</span>
          </div>
          <p className="text-white text-xl">Iniciando SmartChatix...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => setActiveView('archived')}
              className={`px-3 py-2 rounded-lg flex items-center whitespace-nowrap text-sm ${
                activeView === 'archived'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Archive size={14} className="mr-1" />
              Tareas Realizadas
            </button>
            {user?.email === 'erivadeneiraq@gmail.com' && (
              <button
                onClick={() => setActiveView('admin')}
                className={`px-3 py-2 rounded-lg flex items-center whitespace-nowrap text-sm ${
                  activeView === 'admin'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings size={14} className="mr-1" />
                Admin
              </button>
            )}
            <button
              onClick={() => setActiveView('assistant')}
              className={`px-3 py-2 rounded-lg flex items-center whitespace-nowrap text-sm ${
                activeView === 'assistant'
                  ? (isPremiumUser() ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white')
                  : (isPremiumUser() ? 'text-gray-600 hover:bg-gray-100' : 'text-amber-600 hover:bg-amber-50')
              }`}
              title={isPremiumUser() ? "Asistente" : "Funcionalidad Premium"}
            >
              <Bot size={14} className="mr-1" />
              {isPremiumUser() ? 'Asistente' : '⭐ Asistente'}
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
              activeView === 'archived' ?
                renderArchivedTasksView() :
                activeView === 'admin' ?
                  <AdminPanel /> :
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

            {/* Admin Panel - Solo para administradores */}
            {user?.email === 'erivadeneiraq@gmail.com' && (
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setActiveView('admin');
                }}
                className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center"
              >
                <Settings className="mr-2" size={16} />
                Panel de Administración
              </button>
            )}

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

      {/* Modal de Edición Completa de Tarea */}
      {showTaskDetailModal && selectedTaskForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="mr-3 text-blue-600" size={28} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedTaskForDetail.text}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Editor completo de contenido
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={saveTaskDetails}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
                  >
                    <Save className="mr-2" size={16} />
                    Guardar
                  </button>
                  <button
                    onClick={closeTaskDetailModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Selector de Proyecto */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  📁 Proyecto:
                </label>
                <select
                  value={selectedTaskForDetail.project_id || ''}
                  onChange={async (e) => {
                    const newProjectId = e.target.value || null;
                    try {
                      const response = await authenticatedFetch(`${getApiBase()}/daily-tasks/${selectedTaskForDetail.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          projectId: newProjectId
                        })
                      });

                      if (response.ok) {
                        // Actualizar el estado local
                        setSelectedTaskForDetail(prev => ({
                          ...prev,
                          project_id: newProjectId
                        }));

                        // Recargar las tareas diarias para reflejar el cambio
                        await loadUserData();
                      } else {
                        alert('❌ Error al asignar proyecto');
                      }
                    } catch (error) {
                      console.error('Error updating task project:', error);
                      alert('❌ Error al asignar proyecto');
                    }
                  }}
                  className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">Sin proyecto (Independiente)</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">
                  {selectedTaskForDetail.project_id ? 'Asignado' : 'Independiente'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                {/* Panel Principal - Editor */}
                <div className="lg:col-span-2 flex flex-col border-r border-gray-200">
                  {/* Toolbar */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => insertFormatting('bold')}
                        className="p-2 hover:bg-gray-200 rounded"
                        title="Negrita"
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        onClick={() => insertFormatting('italic')}
                        className="p-2 hover:bg-gray-200 rounded"
                        title="Cursiva"
                      >
                        <Italic size={16} />
                      </button>
                      <button
                        onClick={() => insertFormatting('list')}
                        className="p-2 hover:bg-gray-200 rounded"
                        title="Lista"
                      >
                        <List size={16} />
                      </button>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <button
                        onClick={insertFileFromButton}
                        className="p-2 hover:bg-gray-200 rounded"
                        title="Subir archivo"
                      >
                        <Paperclip size={16} />
                      </button>
                      <button
                        onClick={insertImageFromButton}
                        className="p-2 hover:bg-gray-200 rounded"
                        title="Insertar imagen"
                      >
                        <Image size={16} />
                      </button>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <button
                        onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                        className={`p-2 hover:bg-gray-200 rounded ${!showMarkdownPreview ? 'bg-blue-100 text-blue-600' : ''}`}
                        title={showMarkdownPreview ? 'Mostrar Código' : 'Mostrar Preview'}
                      >
                        <Type size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Editor Principal */}
                  <div className="flex-1 p-4">
                    <div className="grid grid-cols-1 h-full">
                      {/* Panel de Edición */}
                      {!showMarkdownPreview && (
                        <div className="flex flex-col">
                        <div className="mb-4 flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción detallada
                          </label>
                          <textarea
                            id="description-editor"
                            value={taskDetailData.description}
                            onChange={(e) => setTaskDetailData(prev => ({ ...prev, description: e.target.value }))}
                            onPaste={handlePasteImage}
                            placeholder="Describe todos los detalles de esta tarea. Puedes pegar imágenes con Ctrl+V..."
                            className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${showMarkdownPreview ? 'h-48' : 'h-64'}`}
                          />
                        </div>

                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas adicionales
                          </label>
                          <textarea
                            value={taskDetailData.notes}
                            onChange={(e) => setTaskDetailData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Agrega notas, recordatorios o comentarios..."
                            className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${showMarkdownPreview ? 'h-24' : 'h-32'}`}
                          />
                        </div>
                        </div>
                      )}

                      {/* Panel de Preview */}
                      {showMarkdownPreview && (
                        <div className="flex flex-col">
                          <div className="mb-4 flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preview - Descripción
                            </label>
                            <div className="w-full h-64 p-3 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto prose prose-sm max-w-none markdown-preview">
                              <div
                                className="cursor-text min-h-full"
                                contentEditable={editingInlineDescription}
                                suppressContentEditableWarning={true}
                                onFocus={() => setEditingInlineDescription(true)}
                                onBlur={handleDescriptionBlur}
                                onClick={handleDescriptionClick}
                                onPaste={(e) => handleWysiwygPasteImage(e, 'description')}
                                dangerouslySetInnerHTML={{
                                  __html: editingInlineDescription
                                    ? markdownToHtml(taskDetailData.description)
                                    : taskDetailData.description
                                      ? markdownToHtml(taskDetailData.description)
                                      : '<p class="text-gray-400 italic">Haz clic aquí para comenzar a escribir...</p>'
                                }}
                                style={{
                                  minHeight: '100%',
                                  outline: 'none',
                                  padding: editingInlineDescription ? '8px' : '0',
                                  border: editingInlineDescription ? '2px solid #3b82f6' : 'none',
                                  borderRadius: editingInlineDescription ? '4px' : '0',
                                  backgroundColor: editingInlineDescription ? '#fefefe' : 'transparent'
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preview - Notas
                            </label>
                            <div className="w-full h-32 p-3 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto prose prose-sm max-w-none markdown-preview">
                              <div
                                className="cursor-text min-h-full"
                                contentEditable={editingInlineNotes}
                                suppressContentEditableWarning={true}
                                onFocus={() => setEditingInlineNotes(true)}
                                onBlur={handleNotesBlur}
                                onClick={handleNotesClick}
                                onPaste={(e) => handleWysiwygPasteImage(e, 'notes')}
                                dangerouslySetInnerHTML={{
                                  __html: editingInlineNotes
                                    ? markdownToHtml(taskDetailData.notes)
                                    : taskDetailData.notes
                                      ? markdownToHtml(taskDetailData.notes)
                                      : '<p class="text-gray-400 italic">Haz clic aquí para añadir notas...</p>'
                                }}
                                style={{
                                  minHeight: '100%',
                                  outline: 'none',
                                  padding: editingInlineNotes ? '8px' : '0',
                                  border: editingInlineNotes ? '2px solid #3b82f6' : 'none',
                                  borderRadius: editingInlineNotes ? '4px' : '0',
                                  backgroundColor: editingInlineNotes ? '#fefefe' : 'transparent'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Panel Lateral - Subtareas y Archivos */}
                <div className="lg:col-span-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    {/* Subtareas */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                          <CheckCircle className="mr-2" size={16} />
                          Subtareas ({taskDetailData.subtasks.length})
                        </h4>
                        <button
                          onClick={addSubtask}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {taskDetailData.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={(e) => updateSubtask(subtask.id, { ...subtask, completed: e.target.checked })}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                {subtask.text}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteSubtask(subtask.id)}
                              className="text-red-500 hover:text-red-700 transition-opacity ml-2"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Archivos Adjuntos */}
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                          <Paperclip className="mr-2" size={16} />
                          Archivos ({taskDetailData.attachments.length})
                        </h4>
                        <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                          <Upload size={16} />
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              if (!selectedTaskForDetail || !e.target.files.length) return;

                              const formData = new FormData();
                              for (const file of e.target.files) {
                                formData.append('files', file);
                              }

                              try {
                                // Usar fetch directamente en lugar de authenticatedFetch para FormData
                                const token = localStorage.getItem('authToken');
                                const response = await fetch(`${getApiBase()}/task-details/${selectedTaskForDetail.id}/attachments`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: formData
                                });

                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.success) {
                                    setTaskDetailData(prev => ({
                                      ...prev,
                                      attachments: [...prev.attachments, ...data.files.map(f => f.file)]
                                    }));
                                  }
                                }
                              } catch (error) {
                                console.error('Error subiendo archivos:', error);
                              }

                              e.target.value = ''; // Reset input
                            }}
                          />
                        </label>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {taskDetailData.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {attachment.is_image ? (
                                <Image size={16} className="text-green-600 flex-shrink-0" />
                              ) : (
                                <FileText size={16} className="text-blue-600 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-700 truncate">{attachment.original_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `${getAttachmentBase()}/${attachment.filename}`;
                                  link.download = attachment.original_name;
                                  link.click();
                                }}
                                className="text-gray-500 hover:text-gray-700"
                                title="Descargar"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await authenticatedFetch(`${getAttachmentBase()}/${attachment.id}`, {
                                      method: 'DELETE'
                                    });

                                    if (response.ok) {
                                      setTaskDetailData(prev => ({
                                        ...prev,
                                        attachments: prev.attachments.filter(a => a.id !== attachment.id)
                                      }));
                                    }
                                  } catch (error) {
                                    console.error('Error eliminando archivo:', error);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700"
                                title="Eliminar"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer del panel lateral */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>📋 {taskDetailData.subtasks.filter(s => s.completed).length} / {taskDetailData.subtasks.length} subtareas completadas</div>
                      <div>📎 {taskDetailData.attachments.length} archivo(s) adjunto(s)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo proyecto */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Crear Nuevo Proyecto</h3>
                <button
                  onClick={() => {
                    setShowCreateProject(false);
                    setIsCreatingProjectForTask(false);
                  }}
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
                  onClick={() => {
                    setShowCreateProject(false);
                    setIsCreatingProjectForTask(false);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addProject}
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
                          await authenticatedFetch(`${getAuthApiBase()}/projects/${selectedProject?.id}`, {
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
                        gap: '12px',
                        flexWrap: 'wrap',
                        minWidth: 0
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
                            cursor: 'text',
                            minWidth: 0,
                            wordWrap: 'break-word',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        flexShrink: 0,
                        minWidth: 0
                      }}>
                        {task.completed && (
                          <CheckCircle
                            size={16}
                            style={{
                              color: '#16a34a'
                            }}
                          />
                        )}
                        {/* Timer Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {/* Timer Display - TEMPORALMENTE OCULTO */}
                          <span style={{
                            fontSize: '10px',
                            color: taskTimers[task.id]?.isActive ? '#3b82f6' : '#6b7280',
                            fontWeight: taskTimers[task.id]?.isActive ? 'bold' : 'normal',
                            minWidth: '35px',
                            display: 'none' // OCULTO POR PETICIÓN DEL USUARIO
                          }}>
                            {getTaskElapsedTime(task.id)}
                          </span>

                          {/* Play/Pause Button - TEMPORALMENTE OCULTO */}
                          <button
                            onClick={() => {
                              if (taskTimers[task.id]?.isActive) {
                                pauseTimer(task.id);
                              } else {
                                startTimer(task.id);
                              }
                            }}
                            style={{
                              backgroundColor: taskTimers[task.id]?.isActive ? '#f59e0b' : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              display: 'none', // OCULTO POR PETICIÓN DEL USUARIO
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title={taskTimers[task.id]?.isActive ? "Pausar timer" : "Iniciar timer"}
                          >
                            {taskTimers[task.id]?.isActive ? '⏸️' : '▶️'}
                          </button>
                        </div>
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
      {chatBubbleOpen && isPremiumUser() && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
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
                      <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: msg.type === 'user' ? '#3B82F6' : '#F3F4F6',
                            color: msg.type === 'user' ? '#FFFFFF' : '#111827',
                            maxWidth: '250px',
                            minWidth: '120px',
                            width: 'auto'
                          }}
                        >
                          {msg.type === 'assistant' ? (
                            <div style={{ color: '#111827', minHeight: '20px' }}>
                              {msg.text}
                            </div>
                          ) : (
                            <span style={{ color: msg.type === 'user' ? '#FFFFFF' : '#111827', minHeight: '20px' }}>
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
          if (!isPremiumUser()) {
            // Si no es premium, cambiar a la vista del asistente que mostrará el mensaje
            setActiveView('assistant');
            return;
          }
          setChatBubbleOpen(!chatBubbleOpen);
          if (!chatBubbleOpen) {
            // Siempre mostrar mensaje de bienvenida cuando se abre
            setTimeout(() => {
              setMessages([{
                id: Date.now(),
                type: 'assistant',
                text: '¡Hola! 👋 Soy tu asistente personal de SmartChatix. Estoy aquí para ayudarte a gestionar tus proyectos y tareas de manera más eficiente. \n\n¿Qué te gustaría hacer hoy?',
                timestamp: new Date().toLocaleTimeString()
              }]);
            }, 300);
          }
        }}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 ${
          chatBubbleOpen
            ? 'bg-gray-500 hover:bg-gray-600'
            : isPremiumUser()
            ? 'bg-blue-500 hover:bg-blue-600'
            : 'bg-amber-500 hover:bg-amber-600'
        } text-white hover:scale-110`}
        title={chatBubbleOpen ? "Cerrar Asistente" : isPremiumUser() ? "Abrir Asistente IA" : "Funcionalidad Premium"}
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
