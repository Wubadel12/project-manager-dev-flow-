function ProjectCard({ project }) {
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : (project.progress || 0);

  return (
    <article className="project-card">
      <div className="project-card-heading">
        <h3>{project.name}</h3>
        <span className={`project-status project-status-${project.status.toLowerCase().replaceAll(" ", "-")}`}>
          {project.status}
        </span>
      </div>

      <p className="project-description">{project.description}</p>

      <div className="project-progress-heading">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>

      <progress className="project-progress" value={progress} max="100" aria-label={`${project.name} progress`} />

      <div className="project-card-footer">
        <p><span>Due</span>{project.dueDate}</p>

        <p><span>Team</span>{project.teamMembers?.length ? project.teamMembers.join(", ") : "No members"}</p>
      </div>
    </article>
  );
}

export default ProjectCard;
