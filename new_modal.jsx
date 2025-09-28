      {showProjectDetailModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="border-b bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedProject.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      selectedProject.priority === 'alta' ? 'bg-red-100 text-red-800' :
                      selectedProject.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedProject.priority.toUpperCase()}
                    </span>
                    {selectedProject.deadline && (
                      <span className="text-sm text-gray-600">
                        📅 {new Date(selectedProject.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
              {selectedProject.description && (
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                  {selectedProject.description}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6">
                {/* Add new task */}
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Agregar una tarea..."
                      value={newProjectTask[selectedProject.id] || ''}
                      onChange={(e) => setNewProjectTask(prev => ({ ...prev, [selectedProject.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          addProjectTask(selectedProject.id);
                        }
                      }}
                      className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => addProjectTask(selectedProject.id)}
                      disabled={!newProjectTask[selectedProject.id]?.trim()}
                      className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Task list */}
                <div className="space-y-2">
                  {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                    selectedProject.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => toggleProjectTaskCompletion(selectedProject.id, task.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        {editingProjectTaskId === task.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingProjectTaskText}
                              onChange={(e) => setEditingProjectTaskText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditedProjectTask();
                                if (e.key === 'Escape') cancelEditingProjectTask();
                              }}
                              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              autoFocus
                            />
                            <button
                              onClick={saveEditedProjectTask}
                              className="text-green-600 hover:text-green-800 p-1"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={cancelEditingProjectTask}
                              className="text-gray-600 hover:text-gray-800 p-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span
                              className={`flex-1 text-sm cursor-pointer ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}
                              onClick={() => startEditingProjectTask(selectedProject.id, task.id, task.title)}
                            >
                              {task.title}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                onClick={() => addProjectTaskToDaily(selectedProject.id, task)}
                                className="text-blue-500 hover:text-blue-700 p-1 rounded"
                                title="Agregar al enfoque diario"
                                disabled={dailyTasks.some(dt => dt.projectId === selectedProject.id && dt.projectTaskId === task.id)}
                              >
                                {dailyTasks.some(dt => dt.projectId === selectedProject.id && dt.projectTaskId === task.id) ? '✓' : '+'}
                              </button>
                              <button
                                onClick={() => deleteProjectTask(selectedProject.id, task.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded"
                                title="Eliminar tarea"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No hay tareas aún. ¡Agrega la primera!</p>
                    </div>
                  )}
                </div>

                {/* Progress summary */}
                {selectedProject.tasks && selectedProject.tasks.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>
                        {selectedProject.tasks.filter(t => t.completed).length} de {selectedProject.tasks.length} tareas completadas
                      </span>
                      <span className="font-medium">
                        {Math.round((selectedProject.tasks.filter(t => t.completed).length / selectedProject.tasks.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(selectedProject.tasks.filter(t => t.completed).length / selectedProject.tasks.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}