import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentPage = location.pathname.startsWith("/projects/")
    ? "Project details"
    : ({ "/": "Overview", "/projects": "Projects", "/tasks": "Tasks", "/team": "Team", "/settings": "Settings", "/setting": "Settings" })[location.pathname] || "Workspace";
  const initials = (user?.name || user?.email || "DF").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function handleLogout() {
    if (await logout()) navigate("/login", { replace: true });
  }

  return <header className="navbar">
    <div className="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{currentPage}</strong></div>
    <div className="navbar-actions">
      <span className="navbar-date">Workspace overview</span>
      <button type="button" className="navbar-notification" aria-label="Notifications" title="No new notifications">â™§<i /></button>
      <div className="navbar-profile">
        <span className="navbar-avatar">{initials}</span>
        <span><strong>{user?.name || user?.email}</strong><small>{user?.email}</small></span>
        <button type="button" className="navbar-logout" onClick={handleLogout}>Sign out</button>
      </div>
    </div>
  </header>;
}

export default Navbar;
