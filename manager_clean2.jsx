import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle, Calendar, Target, TrendingUp, Settings, Archive, Play, Trash2, Edit3, Bot, User, MessageCircle, Send, Save, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Mensajes motivacionales del coach - movido fuera del componente
const coachMessages = [
  "¡Excelente trabajo! Mantén ese momentum 🚀",
  "Cada paso pequeño te acerca a tu meta 💪",
  "Tu constancia es tu superpoder ⭐",
  "Los proyectos no se completan solos, ¡pero tú puedes! 🎯",
  "Prioriza lo importante sobre lo urgente 📈"
];

const PersonalCoachAssistant = () => {
  const [projects, setProjects] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', priority: 'media', deadline: '', description: '' });
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [coachMessage, setCoachMessage] = useState('');

  // Nuevos estados para gestión de tareas de proyectos
  const [selectedProjectForDaily, setSelectedProjectForDaily] = useState('');
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

  // Estados para el asistente
  const [assistantConfig, setAssistantConfig] = useState({
    basePrompt: "Eres mi asistente coach personal para ayudarme a impulsar al máximo todos mis proyectos con éxito. Me vas a ayudar con estrategias, motivación y seguimiento de mis objetivos. Siempre serás directo, práctico y orientado a resultados.",
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
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedConfigSection, setSelectedConfigSection] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const randomMessage = coachMessages[Math.floor(Math.random() * coachMessages.length)];
    setCoachMessage(randomMessage);
  }, []);

  // Recalcular progreso cuando cambien las tareas de los proyectos
  useEffect(() => {
    projects.forEach(project => {
      if (project.tasks.length > 0) {
        const totalProgress = project.tasks.reduce((sum, task) => sum + task.progress, 0);
        const calculatedProgress = Math.round(totalProgress / project.tasks.length);
        if (calculatedProgress !== project.progress) {
          setProjects(prevProjects =>
            prevProjects.map(p =>
              p.id === project.id ? { ...p, progress: calculatedProgress } : p
            )
          );
        }
      }
    });
  }, [projects.map(p => p.tasks.map(t => `${t.progress}-${t.completed}`).join(',')).join(';')]);

  // Scroll automático al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addProject = () => {
    if (newProject.title.trim()) {
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
    }
  };

  const updateProjectProgress = (projectId, progress) => {
    setProjects(projects.map(project =>
      project.id === projectId ? { ...project, progress: Math.min(100, progress) } : project
    ));
  };

  const toggleProjectStatus = (projectId) => {
    setProjects(projects.map(project =>
      project.id === projectId 
        ? { ...project, status: project.status === 'activo' ? 'pausado' : 'activo' }
        : project
    ));
  };

  const archiveProject = (projectId) => {
    setProjects(projects.map(project =>
      project.id === projectId ? { ...project, status: 'completado' } : project
    ));
  };

  const deleteProject = (projectId) => {
    // Solo permitir borrar proyectos sin tareas
    const project = projects.find(p => p.id === projectId);
    if (project && project.tasks.length === 0) {
      setProjects(projects.filter(project => project.id !== projectId));

      // Eliminar cualquier tarea diaria vinculada a este proyecto
      setDailyTasks(dailyTasks.filter(task => task.projectId !== projectId));
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

  const addDailyTask = () => {
    if (newTask.trim()) {
      const taskId = Date.now();
      let projectTaskId = null;

      // Si hay un proyecto seleccionado, agregar la tarea al proyecto primero
      if (selectedProjectForDaily) {
        projectTaskId = taskId + 1; // ID único para la tarea del proyecto

        const projectTask = {
          id: projectTaskId,
          title: newTask.trim(),
          description: '',
          completed: false,
          progress: 0,
          createdAt: new Date().toLocaleDateString()
        };

        setProjects(projects.map(project =>
          project.id === parseInt(selectedProjectForDaily)
            ? { ...project, tasks: [...project.tasks, projectTask] }
            : project
        ));

        // Actualizar progreso del proyecto
        setTimeout(() => updateProjectProgressFromTasks(parseInt(selectedProjectForDaily)), 0);
      }

      // Crear la tarea diaria
      const dailyTask = {
        id: taskId,
        text: newTask,
        completed: false,
        createdAt: new Date().toLocaleDateString(),
        projectId: selectedProjectForDaily ? parseInt(selectedProjectForDaily) : null,
        projectTaskId: projectTaskId
      };

      setDailyTasks([...dailyTasks, dailyTask]);
      setNewTask('');
    }
  };

  // Funciones para gestión de tareas de proyectos
  const addProjectTask = (projectId) => {
    const taskText = newProjectTask[projectId];
    if (taskText && taskText.trim()) {
      const task = {
        id: Date.now(),
        title: taskText.trim(),
        description: '',
        completed: false,
        progress: 0,
        createdAt: new Date().toLocaleDateString()
      };

      setProjects(projects.map(project =>
        project.id === projectId
          ? { ...project, tasks: [...project.tasks, task] }
          : project
      ));

      setNewProjectTask({ ...newProjectTask, [projectId]: '' });
      updateProjectProgressFromTasks(projectId);
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
    }
  };

  const updateProjectProgressFromTasks = (projectId) => {
    setProjects(prevProjects => {
      const project = prevProjects.find(p => p.id === projectId);
      if (project && project.tasks.length > 0) {
        // Calcular progreso como promedio de los porcentajes de todas las tareas
        const totalProgress = project.tasks.reduce((sum, task) => sum + task.progress, 0);
        const averageProgress = Math.round(totalProgress / project.tasks.length);
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

  const deleteProjectTask = (projectId, taskId) => {
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

    updateProjectProgressFromTasks(projectId);
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
    if (customSpecialty.trim() && !availableSpecialties.includes(customSpecialty.trim())) {
      const newSpecialty = customSpecialty.trim();
      setAvailableSpecialties(prev => [...prev, newSpecialty]);
      setAssistantConfig(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty]
      }));
      setCustomSpecialty('');
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
      // Llamada a OpenAI API
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
    return colors[projectId % colors.length];
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-shrink-0">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-semibold text-sm">Proyectos Activos</p>
              <p className="text-xl font-bold text-blue-800">{activeProjects.length}</p>
            </div>
            <Target className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 font-semibold text-sm">Tareas de Hoy</p>
              <p className="text-xl font-bold text-green-800">{completedTasks}/{dailyTasks.length}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 font-semibold text-sm">Efectividad</p>
              <p className="text-xl font-bold text-purple-800">{completionRate}%</p>
            </div>
            <TrendingUp className="text-purple-500" size={24} />
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

          {/* Compact Task Input */}
          <div className="space-y-2 mb-3 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nueva tarea..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDailyTask()}
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={addDailyTask}
                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center text-sm"
              >
                <Plus size={14} />
              </button>
            </div>

            <select
              value={selectedProjectForDaily}
              onChange={(e) => setSelectedProjectForDaily(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Tarea independiente</option>
              {activeProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        {/* Right Column - Project Summary */}
        <div className="w-full lg:w-80 bg-white border rounded-lg p-4 flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold mb-3 flex items-center flex-shrink-0">
            <Target className="mr-2 text-blue-500" size={18} />
            Tareas de Proyectos
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {activeProjects.map(project => {
              const pendingTasks = project.tasks.filter(t => !t.completed && !dailyTasks.some(dt => dt.projectId === project.id && dt.projectTaskId === t.id));
              if (pendingTasks.length === 0) return null;

              return (
                <div key={project.id} className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center text-sm">
                    <span className={`w-2 h-2 rounded-full mr-2 ${getProjectColor(project.id).replace('text-', 'bg-').split(' ')[0]}`}></span>
                    {project.title}
                  </h4>
                  <div className="space-y-1">
                    {pendingTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <span className="flex-1 truncate">{task.title}</span>
                        <button
                          onClick={() => addProjectTaskToDaily(project.id, task)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center ml-2"
                        >
                          <Plus size={10} className="mr-1" /> +
                        </button>
                      </div>
                    ))}
                    {pendingTasks.length > 3 && (
                      <p className="text-xs text-gray-500 text-center py-1">
                        +{pendingTasks.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjectsView = () => (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Crear Nuevo Proyecto</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del proyecto"
            value={newProject.title}
            onChange={(e) => setNewProject({...newProject, title: e.target.value})}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={newProject.priority}
            onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="baja">Prioridad Baja</option>
            <option value="media">Prioridad Media</option>
            <option value="alta">Prioridad Alta</option>
          </select>
          
          <input
            type="date"
            value={newProject.deadline}
            onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={addProject}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 flex items-center justify-center"
          >
            <Plus size={16} className="mr-1" /> Crear Proyecto
          </button>
        </div>
        
        <textarea
          placeholder="Descripción del proyecto (opcional)"
          value={newProject.description}
          onChange={(e) => setNewProject({...newProject, description: e.target.value})}
          className="w-full mt-4 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {/* Título editable */}
                  {editingProjectTitleId === project.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingProjectTitleText}
                        onChange={(e) => setEditingProjectTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveProjectTitle();
                          if (e.key === 'Escape') cancelEditingProjectTitle();
                        }}
                        className="text-lg font-semibold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                        autoFocus
                      />
                      <button
                        onClick={saveProjectTitle}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={cancelEditingProjectTitle}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="text-lg font-semibold">{project.title}</h4>
                      <button
                        onClick={() => startEditingProjectTitle(project.id, project.title)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}

                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                    {project.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'activo' ? 'bg-green-100 text-green-800' :
                    project.status === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status.toUpperCase()}
                  </span>
                </div>
                {/* Descripción editable */}
                <div className="mb-2">
                  {editingProjectDescriptionId === project.id ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editingProjectDescriptionText}
                        onChange={(e) => setEditingProjectDescriptionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) saveProjectDescription();
                          if (e.key === 'Escape') cancelEditingProjectDescription();
                        }}
                        placeholder="Descripción del proyecto..."
                        className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="2"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={saveProjectDescription}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEditingProjectDescription}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="text-gray-600 text-sm flex-1">
                        {project.description || 'Sin descripción'}
                      </p>
                      <button
                        onClick={() => startEditingProjectDescription(project.id, project.description)}
                        className="text-blue-600 hover:text-blue-800 mt-0.5"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Fecha límite editable */}
                <div className="flex items-center gap-2 text-sm">
                  {editingProjectDeadlineId === project.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Fecha límite:</span>
                      <input
                        type="date"
                        value={editingProjectDeadlineText}
                        onChange={(e) => setEditingProjectDeadlineText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveProjectDeadline();
                          if (e.key === 'Escape') cancelEditingProjectDeadline();
                        }}
                        className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={saveProjectDeadline}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={cancelEditingProjectDeadline}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        Fecha límite: {project.deadline || 'Sin fecha límite'}
                      </span>
                      <button
                        onClick={() => startEditingProjectDeadline(project.id, project.deadline)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progreso (promedio de {project.tasks.length} tareas)</span>
                <span>{project.progress}% • {project.tasks.filter(t => t.completed).length}/{project.tasks.length} completadas</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    project.progress === 100 ? 'bg-green-500' :
                    project.progress >= 75 ? 'bg-blue-500' :
                    project.progress >= 50 ? 'bg-yellow-500' :
                    project.progress >= 25 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Gestión de Tareas del Proyecto */}
            <div className="mb-4 border-t pt-4">
              <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                <CheckCircle size={16} className="mr-2" />
                Tareas del Proyecto
              </h5>

              {/* Agregar nueva tarea */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nueva tarea..."
                  value={newProjectTask[project.id] || ''}
                  onChange={(e) => setNewProjectTask({
                    ...newProjectTask,
                    [project.id]: e.target.value
                  })}
                  onKeyDown={(e) => e.key === 'Enter' && addProjectTask(project.id)}
                  className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => addProjectTask(project.id)}
                  className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm flex items-center"
                >
                  <Plus size={14} className="mr-1" /> Agregar
                </button>
              </div>

              {/* Lista de tareas */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {project.tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleProjectTask(project.id, task.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        {editingProjectTaskId === task.id && editingProjectId === project.id ? (
                          <input
                            type="text"
                            value={editingProjectTaskText}
                            onChange={(e) => setEditingProjectTaskText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditedProjectTask();
                              if (e.key === 'Escape') cancelEditingProjectTask();
                            }}
                            onBlur={saveEditedProjectTask}
                            className="w-full p-1 border rounded text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span className={`text-sm font-medium ${
                              task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                            }`}>
                              {task.title}
                            </span>
                            <div className="flex items-center mt-1">
                              <div className="flex-1 mr-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      task.progress === 100 ? 'bg-green-500' :
                                      task.progress >= 75 ? 'bg-blue-500' :
                                      task.progress >= 50 ? 'bg-yellow-500' :
                                      task.progress >= 25 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                              </div>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={task.progress}
                                onChange={(e) => updateTaskProgress(project.id, task.id, e.target.value)}
                                className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                title="Porcentaje de avance"
                              />
                              <span className="text-xs text-gray-500 ml-1">%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {editingProjectTaskId === task.id && editingProjectId === project.id ? (
                        <>
                          <button
                            onClick={saveEditedProjectTask}
                            className="text-green-500 hover:text-green-700 hover:bg-green-50 p-1 rounded"
                            title="Guardar"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={cancelEditingProjectTask}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-1 rounded"
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => addProjectTaskToDaily(project.id, task)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded text-xs"
                            title="Agregar al enfoque diario"
                            disabled={dailyTasks.some(dt => dt.projectId === project.id && dt.projectTaskId === task.id)}
                          >
                            {dailyTasks.some(dt => dt.projectId === project.id && dt.projectTaskId === task.id) ? '✓' : '+'}
                          </button>
                          <button
                            onClick={() => startEditingProjectTask(project.id, task.id, task.title)}
                            className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 p-1 rounded"
                            title="Editar tarea"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteProjectTask(project.id, task.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                            title="Eliminar tarea"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {project.tasks.length === 0 && (
                  <p className="text-gray-500 text-sm italic py-2">No hay tareas aún. ¡Agrega la primera!</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleProjectStatus(project.id)}
                className={`flex items-center px-3 py-1 rounded text-sm ${
                  project.status === 'activo' 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Play size={14} className="mr-1" />
                {project.status === 'activo' ? 'Pausar' : 'Reanudar'}
              </button>
              
              <input
                type="number"
                min="0"
                max="100"
                placeholder="% progreso"
                onChange={(e) => updateProjectProgress(project.id, parseInt(e.target.value) || 0)}
                className="px-3 py-1 border rounded text-sm w-24"
              />
              
              <button
                onClick={() => archiveProject(project.id)}
                className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm"
              >
                <Archive size={14} className="mr-1" />
                Completar
              </button>

              {/* Botón de eliminar - solo visible si no tiene tareas */}
              {project.tasks.length === 0 && (
                <button
                  onClick={() => deleteProject(project.id)}
                  className="flex items-center px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm"
                  title="Eliminar proyecto (solo disponible sin tareas)"
                >
                  <Trash2 size={14} className="mr-1" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConfigSection = () => {
    switch(selectedConfigSection) {
      case 'assistant':
        return (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Configuración del Asistente</h3>

              {/* Nombre del asistente */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🤖 Nombre del asistente
                </label>
                <input
                  type="text"
                  value={assistantConfig.assistantName}
                  onChange={(e) => handleConfigChange('assistantName', e.target.value)}
                  placeholder="Nombre de tu asistente personal"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Prompt base */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Prompt inicial del asistente
                </label>
                <textarea
                  value={assistantConfig.basePrompt}
                  onChange={(e) => handleConfigChange('basePrompt', e.target.value)}
                  placeholder="Instrucciones base para tu asistente..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Especialidades */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🎓 Especialidades del asistente
                </label>

                {/* Especialidades seleccionadas */}
                {assistantConfig.specialties.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {assistantConfig.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                      >
                        {specialty}
                        <button
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                          title="Eliminar especialidad"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Selector de especialidades disponibles */}
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {availableSpecialties.map((specialty) => (
                    <label
                      key={specialty}
                      className="flex items-center hover:bg-gray-50 p-2 rounded cursor-pointer"
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
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>

                {/* Agregar especialidad personalizada */}
                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      placeholder="Agregar especialidad personalizada..."
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSpecialty()}
                    />
                    <button
                      onClick={addCustomSpecialty}
                      disabled={!customSpecialty.trim()}
                      className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Tono */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Tono del asistente
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

              {/* Áreas de enfoque */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🎯 Áreas de enfoque
                </label>
                <div className="space-y-2">
                  {Object.entries(assistantConfig.focusAreas).map(([area, enabled]) => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleFocusAreaChange(area)}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700 capitalize">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'memory':
        return (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Memoria a Largo Plazo</h3>
              <p className="text-gray-600 mb-6">Ayuda a tu asistente a recordar información importante sobre ti para conversaciones más personalizadas.</p>

              <div className="space-y-4">
                {Object.entries(assistantConfig.memory).map(([field, value]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <textarea
                      value={value}
                      onChange={(e) => updateMemory(field, e.target.value)}
                      placeholder={`Describe tu ${field.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}...`}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'user':
        return (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Configuración de Usuario</h3>

              {/* Nombre del usuario */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Tu nombre
                </label>
                <input
                  type="text"
                  value={assistantConfig.userName}
                  onChange={(e) => handleConfigChange('userName', e.target.value)}
                  placeholder="¿Cómo te gustaría que te llame?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Futuras configuraciones de usuario */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Próximamente</h4>
                <p className="text-gray-600 text-sm">
                  • Preferencias de notificaciones<br/>
                  • Zona horaria<br/>
                  • Idioma preferido<br/>
                  • Configuraciones de privacidad
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Settings size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Selecciona una opción del menú para configurar</p>
            </div>
          </div>
        );
    }
  };

  const renderAssistantView = () => {
    return (
      <div className="h-full flex overflow-hidden relative">
        {/* Menú lateral izquierdo estilo ChatGPT */}
        {showConfigPanel && (
          <div className="w-80 bg-gray-900 text-white flex flex-col">
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
                      <div className="font-medium">Configurar Asistente</div>
                      <div className="text-xs text-gray-400">Personalidad, especialidades, prompt</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedConfigSection('memory')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConfigSection === 'memory'
                      ? 'bg-gray-700 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Archive size={18} className="mr-3" />
                    <div>
                      <div className="font-medium">Memoria a Largo Plazo</div>
                      <div className="text-xs text-gray-400">Información personal, contexto</div>
                    </div>
                  </div>
                </button>

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
                      <div className="font-medium">Configuración de Usuario</div>
                      <div className="text-xs text-gray-400">Nombre, preferencias personales</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Botón guardar en la parte inferior */}
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={saveConfiguration}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Save size={16} className="mr-2" />
                {isConfigSaved && <CheckCircle2 size={16} className="mr-2" />}
                {isConfigSaved ? 'Guardado!' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}

        {/* Panel de configuración derecho */}
        {showConfigPanel && selectedConfigSection && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {renderConfigSection()}
          </div>
        )}

        {/* Chat Principal */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          showConfigPanel ? (selectedConfigSection ? 'ml-4' : 'ml-4') : ''
        }`}>
          {/* Header del chat */}
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
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Configurar asistente"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Contenedor del chat */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-lg">
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
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Escribe tu mensaje a ${assistantConfig.assistantName}...`}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
        </div>
      </div>
    );
  };
