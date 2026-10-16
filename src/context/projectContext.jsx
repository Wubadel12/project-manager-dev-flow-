import { useCallback, useEffect, useReducer } from "react";
import { ProjectContext } from "./ProjectContext";
import useAuth from "../hooks/useAuth";
import seedProjects from "../data/project";

const initialState = { projects: seedProjects, loading: true, error: "", ownerId: "" };
const projectsKey = (userId) => `devflow-projects-${userId}`;

function readProjects(userId) {
  try {
    const stored = localStorage.getItem(projectsKey(userId));
    return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(seedProjects));
  } catch {
    return JSON.parse(JSON.stringify(seedProjects));
  }
}

function projectReducer(state, action) {
  switch (action.type) {
    case "LOAD_PROJECTS":
      return { ...state, projects: action.payload, loading: false, error: "", ownerId: action.userId || "" };
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

  useEffect(() => {
    if (authLoading) return;
    reduce({ type: "LOAD_PROJECTS", payload: user ? readProjects(user.id) : JSON.parse(JSON.stringify(seedProjects)), userId: user?.id });
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user && !state.loading && state.ownerId === user.id) {
      try { localStorage.setItem(projectsKey(user.id), JSON.stringify(state.projects)); }
      catch { reduce({ type: "SET_ERROR", payload: "Could not save projects in this browser." }); }
    }
  }, [state.projects, state.loading, state.ownerId, user, authLoading]);

  const dispatch = useCallback(async (action) => {
    reduce({ type: "SET_ERROR", payload: "" });
    try {
      switch (action.type) {
        case "UPDATE_TASK_STATUS": {
          const { taskId, projectId } = action.payload;
          const targetProject = state.projects.find((project) =>
            projectId === undefined ? project.tasks.some((task) => task.id === taskId) : project.id === projectId
          );
          if (!targetProject) throw new Error("Could not find the project for this task.");
          reduce({ ...action, payload: { ...action.payload, projectId: targetProject.id } });
          break;
        }
        default:
          reduce(action);
      }
      return true;
    } catch (error) {
      reduce({ type: "SET_ERROR", payload: error.message });
      return false;
    }
  }, [state.projects]);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
}
