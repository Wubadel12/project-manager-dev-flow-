// src/hooks/useTasks.js
import useProject from "./useProject";

 function useTasks() {
  const { state, dispatch } = useProject();

  const tasks = state.projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectName: project.name,
    }))
  );

  const updateTaskStatus = (taskId, newStatus) => {
    dispatch({
      type: "UPDATE_TASK_STATUS",
      payload: { taskId, newStatus },
    });
  };

  return { tasks, updateTaskStatus };
}

export default useTasks;