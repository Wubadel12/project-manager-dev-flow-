import { useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";

function useProject(){
    const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjects must be used inside a ProjectProvider");
  }

  return context; // { state, dispatch }
}

export default useProject;
