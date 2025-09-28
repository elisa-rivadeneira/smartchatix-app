  const renderProjectsView = () => (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      {/* Botón para crear proyecto */}
      <div className="flex justify-center mb-4">
        {/* Botón flotante para móvil */}
        <button
          onClick={() => setShowCreateProject(!showCreateProject)}
          className="md:hidden fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        >
          <Plus size={24} />
        </button>

        {/* Botón normal para PC */}
        <button
          onClick={() => setShowCreateProject(!showCreateProject)}
          className="hidden md:flex bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors items-center"
        >
          <Plus size={20} className="mr-2" />
          {showCreateProject ? 'Cancelar' : 'Crear Nuevo Proyecto'}
        </button>
      </div>

      {/* Formulario condicional para crear proyecto */}
      {showCreateProject && (
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
      )}

      {/* Sección de proyectos - Layout de tarjetas en cuadrícula */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Encabezado de la tarjeta */}
              <div className="mb-4">
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
                        className="text-xl font-bold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
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
                      <h4 className="text-xl font-bold text-gray-900">{project.title}</h4>
                      <button
                        onClick={() => startEditingProjectTitle(project.id, project.title)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Badges de estado y prioridad */}
                <div className="flex gap-2 mb-3">
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
                <div className="mb-3">
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
                <div className="flex items-center gap-2 text-sm mb-4">
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

              {/* Gestión de Tareas del Proyecto */}
              <div className="mb-4 border-t pt-4">
                <button
                  onClick={() => toggleProjectTasks(project.id)}
                  className="w-full font-normal text-gray-600 mb-3 flex items-center text-sm bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition-colors shadow-sm border-l-4 border-blue-400"
                >
                  {expandedProjectTasks[project.id] ? (
                    <ChevronDown size={14} className="mr-2 text-blue-600 animate-pulse" />
                  ) : (
                    <ChevronRight size={14} className="mr-2 text-blue-600 animate-pulse" />
                  )}
                  <CheckCircle size={14} className="mr-2 opacity-70" />
                  Tareas del Proyecto ({project.tasks?.length || 0})
                  <span className="ml-2 text-xs text-gray-500">(Click para ver)</span>
                </button>

                {/* Sección de tareas expandible */}
                {expandedProjectTasks[project.id] && (
                  <>
                    {/* Agregar nueva tarea */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Nueva tarea del proyecto..."
                        value={newProjectTask[project.id] || ''}
                        onChange={(e) => setNewProjectTask(prev => ({ ...prev, [project.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addProjectTask(project.id);
                        }}
                        className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => addProjectTask(project.id)}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Lista de tareas */}
                    <div className="space-y-2">
                      {project.tasks?.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) => toggleProjectTaskCompletion(project.id, task.id, e.target.checked)}
                              className="rounded"
                            />
                            {editingProjectTaskId === task.id ? (
                              <input
                                type="text"
                                value={editingProjectTaskText}
                                onChange={(e) => setEditingProjectTaskText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveProjectTask();
                                  if (e.key === 'Escape') cancelEditingProjectTask();
                                }}
                                className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                {task.title}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {editingProjectTaskId === task.id ? (
                              <>
                                <button
                                  onClick={saveProjectTask}
                                  className="text-green-600 hover:text-green-800 p-1 rounded"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={cancelEditingProjectTask}
                                  className="text-gray-600 hover:text-gray-800 p-1 rounded"
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
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded"
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
                  </>
                )}
              </div>

              {/* Botones de acción de la tarjeta */}
              <div className="flex gap-2 pt-4 border-t">
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
                  onClick={() => markProjectCompleted(project.id)}
                  className="flex items-center px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm"
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Completar
                </button>

                {/* Botón de eliminar - solo visible si no tiene tareas */}
                {project.tasks.length === 0 && (
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="flex items-center px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm ml-auto"
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
    </div>
  );