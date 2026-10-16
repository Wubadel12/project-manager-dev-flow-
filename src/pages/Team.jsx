import { useMemo, useState } from "react";
import useProject from "../hooks/useProject";
import useWorkspace from "../hooks/useWorkspace";
import "./Team.css";

function Team() {
  const { state } = useProject();
  const { activeWorkspace, addMember } = useWorkspace();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const members = useMemo(() => (activeWorkspace?.members || []).map((member) => ({
    ...member,
    projects: state.projects.filter((project) => (project.teamMembers || []).some((name) => name.toLowerCase() === member.name.toLowerCase())).map((project) => project.name),
  })), [activeWorkspace, state.projects]);

  const visibleMembers = members.filter((member) => {
    const query = search.trim().toLowerCase();
    return (!query || member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query) || member.projects.some((name) => name.toLowerCase().includes(query))) &&
      (roleFilter === "All" || (roleFilter === "Owner" ? member.role === "owner" : member.role === "member"));
  });

  async function handleInvite(event) {
    event.preventDefault(); setError(""); setNotice(""); setSaving(true);
    try {
      await addMember(email);
      setNotice(`${email.trim()} now has access to ${activeWorkspace.name}.`);
      setEmail(""); setShowInvite(false);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  return <main className="team-page"><div className="team-container">
    <header className="team-header"><div><p className="team-eyebrow">WORKSPACE / PEOPLE</p><h1>Team</h1><p>Manage access to {activeWorkspace?.name || "your workspace"}.</p></div>{activeWorkspace?.role === "owner" && <button type="button" className="team-primary" onClick={() => { setShowInvite((value) => !value); setError(""); }}>{showInvite ? "Close form" : "+ Add member"}</button>}</header>
    <section className="team-summary"><div><span>Workspace members</span><strong>{members.length}</strong></div><p>Members have access to the projects in this workspace.</p></section>
    <p className="team-prototype-note">Add an existing DevFlow account by email. Access is granted immediately; no email invitation is sent.</p>
    {notice && <p className="team-notice" role="status">{notice}</p>}
    {showInvite && <section className="team-form-panel"><div><h2>Add a teammate</h2><p>They must already have a DevFlow account.</p></div><form onSubmit={handleInvite} className="team-form"><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>{error && <p className="team-error" role="alert">{error}</p>}<div className="team-form-actions"><button className="team-primary" type="submit" disabled={saving}>{saving ? "Adding…" : "Add to workspace"}</button><button className="team-secondary" type="button" onClick={() => { setShowInvite(false); setError(""); }}>Cancel</button></div></form></section>}
    <section className="team-toolbar"><label><span className="visually-hidden">Search team members</span><input type="search" placeholder="Search name or project..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span className="visually-hidden">Filter by role</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>All</option><option>Owner</option><option>Member</option></select></label><span>{visibleMembers.length} {visibleMembers.length === 1 ? "member" : "members"}</span></section>
    {visibleMembers.length ? <section className="team-grid" aria-label="Team members">{visibleMembers.map((member) => <article className="team-card" key={member.id}><div className="team-card-top"><div className="team-avatar" aria-hidden="true">{member.name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")}</div><span className="team-role">{member.role}</span></div><h2>{member.name}</h2><p className="team-email">{member.email}</p><div className="team-projects"><span>Assigned projects</span><strong>{member.projects.length ? member.projects.join(", ") : "None"}</strong></div></article>)}</section> : <div className="team-empty"><h2>{members.length ? "No matching members" : "No team members yet"}</h2><p>{members.length ? "Try a different search or filter." : "Add a teammate to give them workspace access."}</p>{(search || roleFilter !== "All") && <button className="team-link-button" type="button" onClick={() => { setSearch(""); setRoleFilter("All"); }}>Clear filters</button>}</div>}
  </div></main>;
}

export default Team;
