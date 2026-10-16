import { useMemo, useState } from "react";
import useProject from "../hooks/useProject";
import "./Team.css";

function Team() {
  const { state } = useProject();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const members = useMemo(() => {
    const byName = new Map();
    state.projects.forEach((project) => (project.teamMembers || []).forEach((name) => {
      const key = name.trim().toLowerCase();
      if (!key) return;
      if (!byName.has(key)) byName.set(key, { name: name.trim(), projects: [] });
      byName.get(key).projects.push(project.name);
    }));
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [state.projects]);
  const visibleMembers = members.filter((member) => `${member.name} ${member.projects.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()));

  function handleInvite(event) {
    event.preventDefault();
    setNotice(`Demo invite for ${email.trim()} was not sent or saved.`);
    setEmail("");
    setShowInvite(false);
  }

  return <main className="team-page"><div className="team-container">
    <header className="team-header"><div><p className="team-eyebrow">WORKSPACE / PEOPLE</p><h1>Team</h1><p>See the names assigned across your sample projects.</p></div><button type="button" className="team-primary" onClick={() => setShowInvite((value) => !value)}>{showInvite ? "Close form" : "+ Invite member"}</button></header>
    <section className="team-summary"><div><span>Team members</span><strong>{members.length}</strong></div><p>Team names are read from your local project data.</p></section>
    <p className="team-prototype-note">This frontend-only demo has no real accounts, invitations, or email service.</p>
    {notice && <p className="team-notice" role="status">{notice}</p>}
    {showInvite && <section className="team-form-panel"><div><h2>Invite a teammate</h2><p>This preview does not send or store invitations.</p></div><form onSubmit={handleInvite} className="team-form"><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><div className="team-form-actions"><button className="team-primary" type="submit">Preview invite</button><button className="team-secondary" type="button" onClick={() => setShowInvite(false)}>Cancel</button></div></form></section>}
    <section className="team-toolbar"><label><span className="visually-hidden">Search team members</span><input type="search" placeholder="Search name or project..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><span>{visibleMembers.length} {visibleMembers.length === 1 ? "member" : "members"}</span></section>
    {visibleMembers.length ? <section className="team-grid" aria-label="Team members">{visibleMembers.map((member) => <article className="team-card" key={member.name}><div className="team-card-top"><div className="team-avatar" aria-hidden="true">{member.name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")}</div><span className="team-role">Project teammate</span></div><h2>{member.name}</h2><p className="team-email">Local sample data</p><div className="team-projects"><span>Assigned projects</span><strong>{member.projects.join(", ")}</strong></div></article>)}</section> : <div className="team-empty"><h2>{members.length ? "No matching members" : "No team members yet"}</h2><p>{members.length ? "Try another search term." : "Add team member names to project data to show them here."}</p></div>}
  </div></main>;
}

export default Team;
