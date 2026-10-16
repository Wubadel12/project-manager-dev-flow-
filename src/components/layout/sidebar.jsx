import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import useWorkspace from "../../hooks/useWorkspace";

function Sidebar(){
    const { workspaces, activeWorkspace, setActiveWorkspaceId, createWorkspace } = useWorkspace();
    const [creating, setCreating] = useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceError, setWorkspaceError] = useState("");

    async function handleCreate(event) {
        event.preventDefault();
        try {
            await createWorkspace(workspaceName);
            setWorkspaceName(""); setCreating(false); setWorkspaceError("");
        } catch (error) { setWorkspaceError(error.message); }
    }

    const navigation=[
        {name:"Dashboard", path:"/"},
        {name:"Projects", path:"/projects"},
        {name:"Tasks", path:"/tasks"},
        {name:"Team", path:"/team"},
        {name:"Settings", path:"/settings"},
    ];

    return(
        <aside className="sidebar">
            <Link className="brand" to="/" aria-label="DevFlow home"><span className="brand-mark" aria-hidden="true">D</span><span>devflow</span></Link>
            <div className="workspace-switcher"><span className="workspace-avatar">{(activeWorkspace?.name || "DF").slice(0, 2).toUpperCase()}</span><span className="workspace-picker-wrap"><strong>{activeWorkspace?.name || "Loading workspace…"}</strong><small>Workspace</small><select aria-label="Switch workspace" value={activeWorkspace?.id || ""} onChange={(event) => setActiveWorkspaceId(event.target.value)}>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></span></div>
            <button className="workspace-create-toggle" type="button" onClick={() => { setCreating((value) => !value); setWorkspaceError(""); }}>{creating ? "Cancel" : "+ Create workspace"}</button>
            {creating && <form className="workspace-create-form" onSubmit={handleCreate}><input aria-label="Workspace name" placeholder="Workspace name" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} maxLength={80} required /><button type="submit">Create</button>{workspaceError && <small role="alert">{workspaceError}</small>}</form>}
            <p className="sidebar-section-label">WORKSPACE</p>
            <nav aria-label="Main navigation">
                {
                    navigation.map((item)=> (
                        <NavLink key={item.path} to={item.path} end={item.path === "/"} title={item.name} className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                            <span className={`sidebar-icon sidebar-icon-${item.name.toLowerCase()}`} aria-hidden="true">{({Dashboard:"◫",Projects:"▦",Tasks:"☷",Team:"♧",Settings:"⚙"})[item.name]}</span>
                            {item.name}
                        </NavLink>
                    ))
                }
            </nav>
            <div className="sidebar-bottom"><div className="sidebar-help-mark">?</div><div><strong>Need a hand?</strong><small>Visit the help center</small></div></div>
        </aside>
    )
}

export default Sidebar
