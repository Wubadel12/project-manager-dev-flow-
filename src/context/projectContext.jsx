import { useCallback, useEffect, useReducer } from "react";
import { projectApi } from "../services/projectApi";
import { ProjectContext } from "./ProjectContext";
import useAuth from "../hooks/useAuth";
import useWorkspace from "../hooks/useWorkspace";

const initialState = { projects: [], loading: true, error: "" };

function projectReducer(state, action) {
  switch (action.type) {
    case "LOAD_PROJECTS":
      return { ...state, projects: action.payload, loading: false, error: "" };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.payload], error: "" };
    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.id ? { ...project, ...action.payload } : project
        ),
        error: "",
      };
    case "DELETE_PROJECT":
      return { ...state, projects: state.projects.filter((project) => project.id !== action.payload), error: "" };
    case "UPDATE_TASK_STATUS": {
      const projects = state.projects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === action.payload.taskId &&
          (action.payload.projectId === undefined || project.id === action.payload.projectId)
            ? { ...task, status: action.payload.newStatus }
            : task
        ),
      }));
      return { ...state, projects, error: "" };
    }
    case "ADD_TASK":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, tasks: [...project.tasks, action.payload.task] }
            : project
        ),
        error: "",
      };
    case "DELETE_TASK":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, tasks: project.tasks.filter((task) => task.id !== action.payload.taskId) }
            : project
        ),
        error: "",
      };
    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, reduce] = useReducer(projectReducer, initialState);
  const { user, loading: authLoading } = useAuth();
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace();

  useEffect(() => {
    if (authLoading || workspaceLoading) return;
    if (!user) {
      reduce({ type: "LOAD_PROJECTS", payload: [] });
      return;
    }
    reduce({ type: "SET_LOADING", payload: true });
    if (!activeWorkspaceId) { reduce({ type: "LOAD_PROJECTS", payload: [] }); return; }
    projectApi.list(activeWorkspaceId)
      .then((projects) => reduce({ type: "LOAD_PROJECTS", payload: projects }))
      .catch((error) => reduce({ type: "SET_ERROR", payload: error.message }));
  }, [user, authLoading, workspaceLoading, activeWorkspaceId]);

  const dispatch = useCallback(async (action) => {
    reduce({ type: "SET_ERROR", payload: "" });
    try {
      switch (action.type) {
        case "ADD_PROJECT": {
          const project = await projectApi.create(action.payload, activeWorkspaceId);
          reduce({ ...action, payload: project });
          break;
        }
        case "UPDATE_PROJECT": {
          const project = await projectApi.update(action.payload, activeWorkspaceId);
          reduce({ ...action, payload: project });
          break;
        }
        case "DELETE_PROJECT":
          await projectApi.remove(action.payload, activeWorkspaceId);
          reduce(action);
          break;
        case "ADD_TASK": {
          const { projectId, task } = action.payload;
          const project = await projectApi.addTask(projectId, task, activeWorkspaceId);
          const savedTask = project.tasks.find((item) => String(item.id) === String(task.id));
          reduce({ ...action, payload: { projectId, task: savedTask } });
          break;
        }
        case "UPDATE_TASK_STATUS": {
          const { taskId, projectId, newStatus } = action.payload;
          const targetProject = state.projects.find((project) =>
            projectId === undefined ? project.tasks.some((task) => task.id === taskId) : project.id === projectId
          );
          if (!targetProject) throw new Error("Could not find the project for this task.");
          await projectApi.updateTask(targetProject.id, taskId, { status: newStatus }, activeWorkspaceId);
          reduce({ ...action, payload: { ...action.payload, projectId: targetProject.id } });
          break;
        }
        case "DELETE_TASK":
          await projectApi.removeTask(action.payload.projectId, action.payload.taskId, activeWorkspaceId);
          reduce(action);
          break;
        default:
          break;
      }
      return true;
    } catch (error) {
      reduce({ type: "SET_ERROR", payload: error.message });
      return false;
    }
  }, [state.projects, activeWorkspaceId]);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
}
