import { useEffect, useState } from "react";
import "./Setting.css";

const defaults = { displayName: "", email: "", workspaceName: "DevFlow Workspace", weekStartsOn: "Monday", emailUpdates: true, taskReminders: true, appearance: "System" };
const storageKey = "devflow-settings-session";

function readSettings() {
  try { return { ...defaults, ...JSON.parse(sessionStorage.getItem(storageKey) || "{}") }; }
  catch { return defaults; }
}

function Setting() {
  const [saved, setSaved] = useState(readSettings);
  const [form, setForm] = useState(saved);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(saved)); }
    catch { /* Session storage may be unavailable in restricted browser contexts. */ }
  }, [saved]);

  function handleSave(event) {
    event.preventDefault();
    if (!form.workspaceName.trim()) { setError("Workspace name is required."); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address or leave it blank."); return; }
    const next = { ...form, displayName: form.displayName.trim(), workspaceName: form.workspaceName.trim() };
    setSaved(next);
    setForm(next);
    setError("");
    setNotice("Preferences saved for this browser session.");
  }

  function handleCancel() {
    setForm(saved);
    setError("");
    setNotice("");
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  return <main className="settings-page"><div className="settings-container">
    <header className="settings-header"><div><p className="settings-eyebrow">WORKSPACE / PREFERENCES</p><h1>Settings</h1><p>Configure how DevFlow works for you and your workspace.</p></div><span className="settings-header-mark" aria-hidden="true">⚙</span></header>
    <p className="settings-storage-note">Settings are saved for this browser session only. There is no server sync.</p>
    {notice && <p className="settings-notice" role="status">{notice}</p>}

    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings sections">
        <p>GENERAL</p>
        <a className={activeSection === "profile" ? "settings-nav-link settings-nav-active" : "settings-nav-link"} href="#profile" onClick={() => setActiveSection("profile")}><span aria-hidden="true">◉</span>Profile</a>
        <a className={activeSection === "workspace" ? "settings-nav-link settings-nav-active" : "settings-nav-link"} href="#workspace" onClick={() => setActiveSection("workspace")}><span aria-hidden="true">▦</span>Workspace</a>
        <a className={activeSection === "notifications" ? "settings-nav-link settings-nav-active" : "settings-nav-link"} href="#notifications" onClick={() => setActiveSection("notifications")}><span aria-hidden="true">♧</span>Notifications</a>
        <a className={activeSection === "appearance" ? "settings-nav-link settings-nav-active" : "settings-nav-link"} href="#appearance" onClick={() => setActiveSection("appearance")}><span aria-hidden="true">◐</span>Appearance</a>
        <div className="settings-nav-footnote"><strong>Personal preferences</strong><span>Only apply to this browser session.</span></div>
      </nav>

      <form className="settings-content" onSubmit={handleSave}>
        <section id="profile" className="settings-panel"><header className="settings-panel-heading"><span className="settings-panel-icon">◉</span><div><h2>Profile</h2><p>How your profile appears in this workspace.</p></div></header>
          <div className="settings-row"><div className="settings-row-copy"><label htmlFor="settings-name">Display name</label><p>Used to identify you in the workspace.</p></div><input id="settings-name" className="settings-control" autoComplete="name" maxLength={80} value={form.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="Your name" /></div>
          <div className="settings-row"><div className="settings-row-copy"><label htmlFor="settings-email">Email address</label><p>Optional. Email delivery is not connected.</p></div><input id="settings-email" className="settings-control" type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com" /></div>
        </section>

        <section id="workspace" className="settings-panel"><header className="settings-panel-heading"><span className="settings-panel-icon">▦</span><div><h2>Workspace</h2><p>Set a name and choose your calendar convention.</p></div></header>
          <div className="settings-row"><div className="settings-row-copy"><label htmlFor="settings-workspace">Workspace name</label><p>The label shown for this local workspace.</p></div><input id="settings-workspace" className="settings-control" required maxLength={80} value={form.workspaceName} onChange={(event) => update("workspaceName", event.target.value)} /></div>
          <div className="settings-row"><div className="settings-row-copy"><label htmlFor="settings-week">Week starts on</label><p>Sets the first day used in calendar views.</p></div><select id="settings-week" className="settings-control" value={form.weekStartsOn} onChange={(event) => update("weekStartsOn", event.target.value)}><option>Monday</option><option>Sunday</option></select></div>
        </section>

        <section id="notifications" className="settings-panel"><header className="settings-panel-heading"><span className="settings-panel-icon">♧</span><div><h2>Notifications</h2><p>Choose which notification preferences to keep.</p></div></header>
          <label className="settings-row settings-toggle-row"><span className="settings-row-copy"><strong>Email updates</strong><p>Preference only; DevFlow does not send email.</p></span><span className="settings-switch"><input type="checkbox" checked={form.emailUpdates} onChange={(event) => update("emailUpdates", event.target.checked)} /><span aria-hidden="true" /></span></label>
          <label className="settings-row settings-toggle-row"><span className="settings-row-copy"><strong>Task reminders</strong><p>Preference only; no reminder service is connected.</p></span><span className="settings-switch"><input type="checkbox" checked={form.taskReminders} onChange={(event) => update("taskReminders", event.target.checked)} /><span aria-hidden="true" /></span></label>
        </section>

        <section id="appearance" className="settings-panel"><header className="settings-panel-heading"><span className="settings-panel-icon">◐</span><div><h2>Appearance</h2><p>Choose the theme preference for your workspace.</p></div></header>
          <div className="settings-row settings-appearance-row"><div className="settings-row-copy"><strong>Theme</strong><p>Theme switching is not connected yet.</p></div><div className="settings-theme-options" role="group" aria-label="Theme preference">{["System", "Light", "Dark"].map((theme) => <button key={theme} type="button" className={form.appearance === theme ? "settings-theme-option selected" : "settings-theme-option"} aria-pressed={form.appearance === theme} onClick={() => update("appearance", theme)}><span aria-hidden="true">{theme === "System" ? "◐" : theme === "Light" ? "☼" : "◑"}</span>{theme}</button>)}</div></div>
        </section>

        {error && <p className="settings-error" role="alert">{error}</p>}
        <div className="settings-actions"><button className="settings-save" type="submit">Save changes</button><button className="settings-cancel" type="button" onClick={handleCancel}>Discard</button></div>
      </form>
    </div>
  </div></main>;
}

export default Setting;
