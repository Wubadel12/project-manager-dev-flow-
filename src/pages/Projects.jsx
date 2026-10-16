import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useProject from "../hooks/useProject";
import "./Projects.css";

const emptyForm = { name: "", description: "", status: "Planning", dueDate: "", teamMembers: "" };

function Projects() {
  const { state, dispatch } = useProject();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const projects = state.projects;

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const query = search.trim().toLowerCase();
    return (!query || project.name.toLowerCase().includes(query) || project.description.toLowerCase().includes(query)) &&
      (status === "All" || project.status === status);
  }), [projects, search, status]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  function openEdit(project) {
    setEditing(project.id);
    setForm({ name: project.name, description: project.description, status: project.status, dueDate: project.dueDate || "", teamMembers: (project.teamMembers || []).join(", ") });
    setError("");
    setNotice("");
    document.getElementById("project-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.dueDate) {
      setError("Enter a project name, description, and due date.");
      return;
    }
    const matchingProject = projects.find((project) => project.id === editing);
    const updated = {
      ...(matchingProject || {}),
      id: editing ?? Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      dueDate: form.dueDate,
      teamMembers: form.teamMembers.split(",").map((name) => name.trim()).filter(Boolean),
      tasks: matchingProject?.tasks || [],
    };
    const saved = await dispatch({ type: editing ? "UPDATE_PROJECT" : "ADD_PROJECT", payload: updated });
    if (!saved) return;
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setNotice(editing ? "Project updated." : "Project created.");
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete “${project.name}” and its tasks? This cannot be undone.`)) return;
    const deleted = await dispatch({ type: "DELETE_PROJECT", payload: project.id });
    if (!deleted) return;
    setNotice(`“${project.name}” was deleted.`);
    if (editing === project.id) openCreate();
  }

  return (
    <main className="projects-page">
      <div className="projects-page-container">
        <header className="projects-header">
          <div>
            <p className="projects-eyebrow">WORKSPACE / PROJECTS</p>
            <h1>Projects</h1>
            <p>Plan work, track progress, and keep every initiative on course.</p>
          </div>
          <button type="button" className="projects-primary-button projects-create-button" onClick={() => { openCreate(); document.getElementById("project-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>+ Create project</button>
        </header>

        {notice && <p className="projects-notice" role="status">{notice}</p>}

        <section id="project-form" className="projects-form-panel" aria-labelledby="project-form-title">
          <div className="projects-section-heading">
            <div><h2 id="project-form-title">{editing ? "Edit project" : "Create a project"}</h2><p>{editing ? "Update the project details below." : "Add a project to your workspace."}</p></div>
            {editing && <button type="button" className="projects-text-button" onClick={openCreate}>Cancel edit</button>}
          </div>
          <form onSubmit={handleSubmit} className="projects-form">
            <label>Project name<input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Website redesign" /></label>
            <label>Description<input required maxLength={180} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What is this project about?" /></label>
            <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Planning</option><option>In Progress</option><option>Completed</option></select></label>
            <label>Due date<input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
            <label>Team members (comma separated)<input value={form.teamMembers} onChange={(event) => setForm({ ...form, teamMembers: event.target.value })} placeholder="e.g. Alex, Sam" /></label>
            {error && <p className="projects-error" role="alert">{error}</p>}
            <div className="projects-form-actions"><button className="projects-primary-button" type="submit">{editing ? "Save changes" : "Create project"}</button>{editing && <button className="projects-secondary-button" type="button" onClick={openCreate}>Cancel</button>}</div>
          </form>
        </section>

        <section className="projects-toolbar" aria-label="Project filters">
          <label className="projects-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search projects" placeholder="Search projects..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label className="projects-status-filter"><span className="visually-hidden">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="All">All statuses</option><option>Planning</option><option>In Progress</option><option>Completed</option></select></label>
          <span className="projects-count">{filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}</span>
        </section>

        {filteredProjects.length ? <section className="projects-grid" aria-label="Projects">
          {filteredProjects.map((project) => {
            const tasks = project.tasks || [];
            const completed = tasks.filter((task) => task.status === "Completed").length;
            const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : (project.progress || 0);
            return <article className="projects-card" key={project.id}>
              <div className="projects-card-heading"><h2><Link to={`/projects/${project.id}`}>{project.name}</Link></h2><span className={`projects-status-badge projects-status-${project.status.toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span></div>
              <p className="projects-card-description">{project.description}</p>
              <div className="projects-progress-heading"><span>Progress</span><strong>{progress}%</strong></div>
              <progress value={progress} max="100" aria-label={`${project.name} progress`} />
              <div className="projects-task-summary">{completed} of {tasks.length} tasks completed</div>
              <div className="projects-card-meta"><div><span>Due date</span><strong>{project.dueDate ? new Date(`${project.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not set"}</strong></div><div><span>Team</span><strong>{project.teamMembers?.length ? project.teamMembers.join(", ") : "No members"}</strong></div></div>
              <div className="projects-card-actions"><Link to={`/projects/${project.id}`} className="projects-view-link">View details <span aria-hidden="true">→</span></Link><button type="button" onClick={() => openEdit(project)}>Edit</button><button type="button" className="projects-delete" onClick={() => deleteProject(project)}>Delete</button></div>
            </article>;
          })}
        </section> : <div className="projects-empty"><div aria-hidden="true" className="projects-empty-mark">⌕</div><h2>No projects found</h2><p>{projects.length ? "Try another search or status filter." : "Create your first project to start organizing work."}</p>{(search || status !== "All") && <button className="projects-text-button" type="button" onClick={() => { setSearch(""); setStatus("All"); }}>Clear filters</button>}</div>}
      </div>
    </main>
  );
}

export default Projects;
