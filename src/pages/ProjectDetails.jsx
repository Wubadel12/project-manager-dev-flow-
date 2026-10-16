import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import useProject from "../hooks/useProject";
import "./ProjectDetails.css";

const statusClasses = { Todo: "detail-status-todo", "In Progress": "detail-status-progress", Completed: "detail-status-completed" };
const priorityClasses = { Low: "detail-priority-low", Medium: "detail-priority-medium", High: "detail-priority-high" };

function ProjectDetails() {
  const { id } = useParams();
  const { state, dispatch } = useProject();
  const project = state.projects.find((item) => String(item.id) === id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!project) return <main className="project-detail-page"><div className="project-detail-container"><section className="detail-empty"><h1>Project not found</h1><p>This project may have been removed or the link may be incorrect.</p><Link to="/projects" className="detail-primary">Back to projects</Link></section></div></main>;

  const tasks = project.tasks || [];
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : (project.progress || 0);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) { setError("Enter a title for this task."); return; }
    const saved = await dispatch({ type: "ADD_TASK", payload: { projectId: project.id, task: { id: `${project.id}-${crypto.randomUUID()}`, title: title.trim(), status: "Todo", priority } } });
    if (!saved) return;
    setTitle(""); setPriority("Medium"); setError(""); setShowForm(false); setNotice("Task added to this project.");
  }

  async function changeStatus(taskId, newStatus) {
    const saved = await dispatch({ type: "UPDATE_TASK_STATUS", payload: { projectId: project.id, taskId, newStatus } });
    if (!saved) return;
    setNotice("Task status updated.");
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    const deleted = await dispatch({ type: "DELETE_TASK", payload: { projectId: project.id, taskId: task.id } });
    if (!deleted) return;
    setNotice("Task deleted.");
  }

  return (
    <main className="project-detail-page">
      <div className="project-detail-container">
        <Link to="/projects" className="detail-back">← Back to projects</Link>
        <header className="detail-header">
          <div><p className="detail-eyebrow">PROJECT OVERVIEW</p><h1>{project.name}</h1><p>{project.description}</p></div>
          <span className={`detail-project-status detail-project-${project.status.toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span>
        </header>

        <section className="detail-overview-grid" aria-label="Project overview">
          <article className="detail-panel detail-progress-panel"><div className="detail-progress-heading"><div><h2>Overall progress</h2><p>Based on completed project tasks</p></div><strong>{progress}%</strong></div><progress value={progress} max="100" aria-label={`${project.name} progress`} /><div className="detail-count-row"><span>{completed} completed</span><span>{tasks.length - completed} remaining</span></div></article>
          <article className="detail-panel"><span className="detail-label">Due date</span><strong className="detail-value">{project.dueDate ? new Date(`${project.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Not set"}</strong></article>
          <article className="detail-panel"><span className="detail-label">Tasks</span><strong className="detail-value">{tasks.length}</strong><span className="detail-note">{completed} completed</span></article>
          <article className="detail-panel"><span className="detail-label">Team</span><strong className="detail-value detail-team-value">{project.teamMembers?.length ? project.teamMembers.join(", ") : "No members assigned"}</strong></article>
        </section>

        {notice && <p className="detail-notice" role="status">{notice}</p>}

        <section className="detail-tasks-panel">
          <div className="detail-list-heading"><div><h2>Project tasks</h2><p>Manage the work associated with this project.</p></div><button type="button" className="detail-primary" onClick={() => { setShowForm((current) => !current); setError(""); }}>{showForm ? "Close form" : "+ Add task"}</button></div>

          {showForm && <form className="detail-task-form" onSubmit={addTask}><label>Task title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Review project requirements" maxLength={120} /></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>{error && <p className="detail-error" role="alert">{error}</p>}<div className="detail-form-actions"><button className="detail-primary" type="submit">Add task</button><button className="detail-secondary" type="button" onClick={() => { setShowForm(false); setError(""); }}>Cancel</button></div></form>}

          {tasks.length ? <div className="detail-task-list">{tasks.map((task) => <article className="detail-task-row" key={task.id}><div className="detail-task-copy"><h3>{task.title}</h3><div className="detail-task-badges"><span className={`detail-badge ${priorityClasses[task.priority] || "detail-priority-medium"}`}>{task.priority || "Medium"} priority</span><span className={`detail-badge ${statusClasses[task.status] || "detail-status-todo"}`}>{task.status}</span></div></div><div className="detail-task-actions"><label className="visually-hidden" htmlFor={`detail-status-${project.id}-${task.id}`}>Change status for {task.title}</label><select id={`detail-status-${project.id}-${task.id}`} value={task.status} onChange={(event) => changeStatus(task.id, event.target.value)}><option>Todo</option><option>In Progress</option><option>Completed</option></select><button type="button" className="detail-delete" onClick={() => deleteTask(task)} aria-label={`Delete ${task.title}`}>Delete</button></div></article>)}</div> : <div className="detail-empty detail-tasks-empty"><h3>No tasks yet</h3><p>Add a task to start tracking work for this project.</p><button type="button" className="detail-text-button" onClick={() => setShowForm(true)}>Add the first task</button></div>}
        </section>
      </div>
    </main>
  );
}

export default ProjectDetails;
