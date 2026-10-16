
import { useContext, useMemo, useState } from "react";
import { ProjectContext } from "../context/ProjectContext";
import "./Tasks.css";

const statusStyles = {
  Todo: "status-todo",
  "In Progress": "status-progress",
  Completed: "status-completed",
};

const priorityStyles = {
  Low: "priority-low",
  Medium: "priority-medium",
  High: "priority-high",
};

function Tasks() {
  const context = useContext(ProjectContext);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [formError, setFormError] = useState("");

  const { state, dispatch } = context || { state: { projects: [] }, dispatch: () => {} };
  const projects = state.projects;

  const allTasks = useMemo(
    () =>
      projects.flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
        }))
      ),
    [projects]
  );

  if (!context) {
    return (
      <div className="provider-error">
        ProjectProvider is missing. Wrap your app with ProjectProvider in main.jsx.
      </div>
    );
  }

  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.projectName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" || task.status === selectedStatus;

    const matchesProject =
      selectedProject === "All" ||
      String(task.projectId) === selectedProject;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const completedCount = allTasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgressCount = allTasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  async function handleAddTask(event) {
    event.preventDefault();

    if (!title.trim()) {
      setFormError("Please enter a task title.");
      return;
    }

    if (!projectId) {
      setFormError("Please select a project.");
      return;
    }

    const task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      status: "Todo",
      priority,
    };

    const saved = await dispatch({
      type: "ADD_TASK",
      payload: {
        projectId: projects.find(
          (project) => String(project.id) === projectId
        ).id,
        task,
      },
    });

    if (!saved) return;
    setTitle("");
    setPriority("Medium");
    setFormError("");
    setShowForm(false);
  }

  async function handleDeleteTask(task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    await dispatch({
      type: "DELETE_TASK",
      payload: {
        projectId: task.projectId,
        taskId: task.id,
      },
    });
  }

  async function handleStatusChange(task, newStatus) {
    await dispatch({
      type: "UPDATE_TASK_STATUS",
      payload: {
        taskId: task.id,
        projectId: task.projectId,
        newStatus,
      },
    });
  }

  return (
    <main className="tasks-page">
      <div className="tasks-container">
        {/* Header */}
        <header className="tasks-header">
          <div>
            <p className="eyebrow">
              WORKSPACE / TASKS
            </p>
            <h1 className="tasks-title">
              Tasks
            </h1>
            <p className="tasks-description">
              Organize your work, track progress, and keep every project moving.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="primary-button add-task-button"
          >
            <span className="plus-icon">+</span>
            {showForm ? "Close form" : "Add task"}
          </button>
        </header>

        {/* Statistics */}
        <section className="stats-grid">
          <StatCard
            label="Total tasks"
            value={allTasks.length}
            note="Across all projects"
            icon="▤"
            iconClass="icon-indigo"
          />
          <StatCard
            label="In progress"
            value={inProgressCount}
            note="Currently being worked on"
            icon="◷"
            iconClass="icon-amber"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            note="Successfully finished"
            icon="✓"
            iconClass="icon-emerald"
          />
        </section>

        {/* Add task form */}
        {showForm && (
          <section className="task-form-panel">
            <div className="form-heading">
              <h2 className="section-title">Create a new task</h2>
              <p className="muted-text">
                Choose a project and give your task a clear title.
              </p>
            </div>

            <form onSubmit={handleAddTask} className="task-form">
              <div className="form-grid">
                <div className="form-field form-field-wide">
                  <label
                    htmlFor="task-title"
                    className="form-label"
                  >
                    Task title
                  </label>
                  <input
                    id="task-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Build login page"
                    className="form-control"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-project"
                    className="form-label"
                  >
                    Project
                  </label>
                  <select
                    id="task-project"
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={String(project.id)}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-priority"
                    className="form-label"
                  >
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="form-control"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {formError && (
                <p role="alert" className="form-error">
                  {formError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                >
                  Create task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Search and filters */}
        <section className="filters-panel">
          <div className="filters-grid">
            <div className="search-control">
              <span
                aria-hidden="true"
                className="search-icon"
              >
                ⌕
              </span>
              <input
                aria-label="Search tasks"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks or projects..."
                className="form-control search-input"
              />
            </div>

            <select
              aria-label="Filter by status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="form-control filter-control"
            >
              <option value="All">All statuses</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              aria-label="Filter by project"
              value={selectedProject}
              onChange={(event) => setSelectedProject(event.target.value)}
              className="form-control filter-control"
            >
              <option value="All">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Task list */}
        <section className="task-list-panel">
          <div className="list-heading">
            <div>
              <h2 className="section-title">All tasks</h2>
              <p className="muted-text">
                Your tasks from every project in one place.
              </p>
            </div>
            <span className="result-count">
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          {filteredTasks.length > 0 ? (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article
                  key={`${task.projectId}-${task.id}`}
                  className="task-row"
                >
                  <div className="task-main">
                    <div className="task-avatar">
                      {task.title.charAt(0).toUpperCase()}
                    </div>

                    <div className="task-copy">
                      <h3 className="task-title">
                        {task.title}
                      </h3>
                      <p className="muted-text">
                        <span className="project-name">
                          {task.projectName}
                        </span>
                        <span className="meta-separator">•</span>
                        Task #{task.id}
                      </p>

                      <div className="task-badges">
                        <span
                          className={`badge ${
                            priorityStyles[task.priority] ||
                            "priority-default"
                          }`}
                        >
                          {task.priority || "Medium"} priority
                        </span>
                        <span
                          className={`badge status-badge ${
                            statusStyles[task.status] ||
                            "status-default"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="task-actions">
                    <label className="visually-hidden" htmlFor={`status-${task.projectId}-${task.id}`}>
                      Change status for {task.title}
                    </label>
                    <select
                      id={`status-${task.projectId}-${task.id}`}
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(task, event.target.value)
                      }
                      className="form-control status-select"
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                ▤
              </div>
              <h3 className="empty-title">
                No tasks found
              </h3>
              <p className="empty-description">
                Try changing your search or filters, or create a new task to
                get started.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("All");
                  setSelectedProject("All");
                }}
                className="text-button"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <p className="tasks-footer">
          DevFlow · Keep your work moving.
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value, note, icon, iconClass }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">
            {value}
          </p>
        </div>
        <div
          className={`stat-icon ${iconClass}`}
        >
          {icon}
        </div>
      </div>
      <p className="stat-note">{note}</p>
    </article>
  );
}

export default Tasks;
