# DevFlow --- Codex Handoff

## Project purpose

DevFlow is a professional project-management dashboard inspired by Jira,
Trello, and GitHub Projects. It is also a learning project for React.
The user wants to build it step by step and understand the code, not
have the whole project generated automatically.

## Teaching preferences

-   Teach in small steps, usually one or two tasks at a time.
-   Explain why code works, using concrete examples.
-   Let the user try first when they ask for hints.
-   If the user says they are stuck or explicitly asks for code, provide
    working code and explain it.
-   Avoid overwhelming rewrites and avoid taking over the whole project.
-   Check the existing code before suggesting architectural changes;
    preserve working features.

## Intended features

-   Dashboard with project/task statistics and recent activity.
-   Projects: list, search/filter, create/edit/delete.
-   Project details with tasks and status changes.
-   Tasks: list all tasks, search, status filter, change status,
    add/edit/delete.
-   Team and Settings pages.
-   Later: persistence, API/backend, authentication, and database.

## Planned routes

-   `/` → Dashboard
-   `/projects` → Projects
-   `/projects/:id` → ProjectDetails
-   `/tasks` → Tasks
-   `/team` → Team
-   `/settings` → Settings

## Existing structure

The project has a Vite + React setup and React Router. Current intended
structure:

``` text
src/
├── components/
│   ├── layout/
│   ├── common/
│   ├── projects/
│   └── tasks/
├── pages/
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   ├── ProjectDetails.jsx
│   ├── Tasks.jsx
│   ├── Team.jsx
│   └── Settings.jsx
├── context/
├── hooks/
├── reducer/
├── data/
│   └── projects.js
├── utils/
├── App.jsx
├── main.jsx
└── App.css
```

Layout structure:

``` text
Layout
 ├── Sidebar
 └── main-content
     ├── Navbar
     └── Outlet
```

## Work completed

1.  Created the folder structure and routes; all routes worked.
2.  Created `Layout.jsx` and `Sidebar.jsx`; Layout uses `Outlet`,
    Sidebar uses `NavLink`.
3.  Configured nested routes in `App.jsx` and `BrowserRouter` in
    `main.jsx`.
4.  Created `Navbar.jsx` with a search field, notification button, and
    user label (visual-only).
5.  Created `StatCard.jsx`, taking `{ title, value, icon }`.
6.  Created `src/data/projects.js` with five sample projects:
    -   EduCart
    -   University Management System
    -   AI Study Assistant
    -   Developer Portfolio
    -   Restaurant Menu App
7.  Each project should have `id`, `name`, `description`, `status`,
    `progress`, `dueDate`, `teamMembers`, and `tasks`.
8.  Each task should have a unique `id`, `title`, `status` (`"Todo"`,
    `"In Progress"`, or `"Completed"`), and `priority`.
9.  Created `ProjectCard.jsx` to display project information and
    progress.
10. Dashboard maps over projects to render project cards and calculates
    project statistics using array methods such as `filter`, `length`,
    and `reduce`.
11. Created `Tasks.jsx` with:
    -   `projects.flatMap(...)` to flatten project tasks into one array,
    -   search by task title,
    -   filter by status,
    -   project name attached to each task.
12. Tested the `/tasks` page, search, and status filter successfully.
13. Added a status dropdown to each task. First tested its `onChange`
    using `console.log`.
14. Then changed `Tasks.jsx` to keep a local `tasks` state using
    `useState`, and added an `updateTaskStatus(taskId, newStatus)`
    function. It uses `map` and object spread to update the matching
    task. This worked, but this state is local to `Tasks.jsx` and resets
    on refresh; changes do not update other pages.

## Current state / latest work

The user created `src/context/ProjectContext.jsx` and added this
reducer/provider implementation:

``` jsx
import { createContext, useReducer } from "react";
import projectsData from "../data/projects";

export const ProjectContext = createContext();

const initialState = {
  projects: projectsData,
};

function projectReducer(state, action) {
  switch (action.type) {
    case "UPDATE_TASK_STATUS": {
      const updatedProjects = state.projects.map((project) => {
        const updatedTasks = project.tasks.map((task) => {
          if (task.id === action.payload.taskId) {
            return {
              ...task,
              status: action.payload.newStatus,
            };
          }

          return task;
        });

        return {
          ...project,
          tasks: updatedTasks,
        };
      });

      return {
        ...state,
        projects: updatedProjects,
      };
    }

    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
}
```

This code was provided by the assistant; the user has not yet confirmed
that it is saved or compiling. It is not connected to the app yet.

## Next step

Continue teaching in small steps. First ask the user to confirm that
`ProjectContext.jsx` is saved and there are no syntax errors (or help
debug if needed). Then connect `ProjectProvider` around the app's
route/layout tree, likely in `main.jsx`, while preserving
`BrowserRouter`. After that, update `Tasks.jsx` to use
`useContext(ProjectContext)` and
`dispatch({ type: "UPDATE_TASK_STATUS", payload: { taskId, newStatus } })`
instead of its local task state. Derive the flattened task list from
`state.projects`, so Dashboard and Tasks can eventually share the same
source of truth. Carefully account for existing search/filter state and
don't reintroduce the old `allTasks` array from static data. Later,
update Dashboard and Project Details to use Context too.

## Important implementation notes

-   `projects.js` is currently static imported sample data. Reducer
    state changes only persist in memory; refresh loses them unless
    persistence is added.
-   Every project needs a `tasks` array, otherwise `project.tasks.map`
    will fail.
-   Task IDs should be unique across all projects, since current status
    updates search all projects by task ID.
-   Reducers should not mutate existing state. Use `map` and spread to
    create new objects/arrays.
-   `ProjectProvider` exports named `ProjectProvider`; import it with
    braces.
-   Do not claim changes are shared across the app until all relevant
    pages read from the provider state.

## Instructions for Codex

Start by inspecting the current workspace files and compare them with
this handoff. Do not overwrite working code blindly. Tell the user what
already exists, identify the next smallest step, and explain the
changes. Do not build the entire application at once. The user wants to
learn by implementing and testing each step.
