import { Link, NavLink } from "react-router-dom";

function Sidebar(){
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
            <div className="workspace-switcher"><span className="workspace-avatar">DF</span><span><strong>DevFlow Studio</strong><small>Local demo</small></span></div>
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
