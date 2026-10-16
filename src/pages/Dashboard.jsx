import { useContext } from "react";
import { Link } from "react-router-dom";
import { ProjectContext } from "../context/ProjectContext";
import StatCard from "../components/common/statCard";
import ProjectCard from "../components/projects/projectCard";
import "./Dashboard.css";

function Dashboard() {
  const { state } = useContext(ProjectContext);
  const projects = state.projects;
  const totalTasks = projects.reduce((total, project) => total + project.tasks.length, 0);
  const inProgressProjects = projects.filter((project) => project.status === "In Progress").length;
  const completedProjects = projects.filter((project) => project.status === "Completed").length;
  const completedTasks = projects.reduce((total, project) => total + project.tasks.filter((task) => task.status === "Completed").length, 0);

  return <div className="dashboard-page">
    <header className="dashboard-header"><div><p className="dashboard-eyebrow">WORKSPACE / OVERVIEW</p><h1>Dashboard</h1><p>Welcome back. Here’s what’s moving across your workspace.</p></div><span className="dashboard-date-label">Workspace overview</span></header>
    <section className="dashboard-welcome-strip"><div><span className="welcome-icon" aria-hidden="true">✦</span><p><strong>Your work, in focus.</strong><span>Review active projects and keep the next milestone moving.</span></p></div><Link to="/projects">Explore projects <span aria-hidden="true">→</span></Link></section>
    <div className="stats-container">
      <StatCard title="Total projects" value={projects.length} icon="▦" />
      <StatCard title="Total tasks" value={totalTasks} icon="☷" />
      <StatCard title="In progress" value={inProgressProjects} icon="◷" />
      <StatCard title="Completed" value={completedProjects} icon="✓" />
    </div>
    <section className="dashboard-projects">
      <div className="dashboard-section-heading"><div><h2>Recent projects</h2><p>A snapshot of the work in your workspace.</p></div><Link to="/projects">View all <span aria-hidden="true">→</span></Link></div>
      <div className="projects-container">{projects.slice(0, 4).map((project) => <ProjectCard key={project.id} project={project} />)}</div>
      <p className="dashboard-completion-note">{completedTasks} tasks completed across {projects.length} projects</p>
    </section>
  </div>;
}

export default Dashboard;
