import { mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import seedProjects from "../src/data/project.js";

const here = dirname(fileURLToPath(import.meta.url));
const databasePath = resolve(here, process.env.DATABASE_PATH || "../data/devflow.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
const scryptAsync = promisify(scrypt);
database.exec("PRAGMA foreign_keys = ON");
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`);
database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());

const projectTable = database.prepare(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'"
).get();
const projectColumns = projectTable
  ? database.prepare("PRAGMA table_info(projects)").all().map((column) => column.name)
  : [];
let insertProject;
let insertTask;

function createSchema() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Planning', 'In Progress', 'Completed')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
      due_date TEXT,
      team_members TEXT NOT NULL DEFAULT '[]',
      owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT NOT NULL,
      id_type TEXT NOT NULL CHECK (id_type IN ('number', 'string')),
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Todo', 'In Progress', 'Completed')),
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (project_id, id)
    );
  `);

  insertProject = database.prepare(`
    INSERT INTO projects (id, name, description, status, progress, due_date, team_members, owner_user_id, workspace_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTask = database.prepare(`
    INSERT INTO tasks (id, id_type, project_id, title, status, priority, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
}

function runTransaction(work) {
  database.exec("BEGIN");
  try {
    work();
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

if (projectTable && !projectColumns.includes("data") && !projectColumns.includes("owner_user_id")) {
  database.exec("ALTER TABLE projects ADD COLUMN owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE");
}
if (projectTable && !projectColumns.includes("data") && !projectColumns.includes("workspace_id")) {
  database.exec("ALTER TABLE projects ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE");
}
function importProjects(projects) {
  for (const project of projects) {
    insertProject.run(
      project.id,
      project.name,
      project.description,
      project.status,
      project.progress ?? 0,
      project.dueDate || null,
      JSON.stringify(project.teamMembers || []),
      null,
      null
    );
    (project.tasks || []).forEach((task, position) => {
      const idType = typeof task.id === "number" ? "number" : "string";
      insertTask.run(String(task.id), idType, project.id, task.title, task.status, task.priority || "Medium", position);
    });
  }
}

if (projectColumns.includes("data")) {
  const oldProjects = database.prepare("SELECT data FROM projects ORDER BY id").all()
    .map(({ data }) => JSON.parse(data));
  runTransaction(() => {
    database.exec("ALTER TABLE projects RENAME TO projects_legacy");
    createSchema();
    importProjects(oldProjects);
    database.exec("DROP TABLE projects_legacy");
  });
} else {
  createSchema();
  const count = database.prepare("SELECT COUNT(*) AS total FROM projects").get().total;
  if (count === 0) runTransaction(() => importProjects(seedProjects));
}
database.exec("CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id)");

const workspaceById = database.prepare("SELECT id, name, owner_user_id AS ownerId FROM workspaces WHERE id = ?");
const userWorkspaces = database.prepare(`
  SELECT w.id, w.name, wm.role FROM workspaces w
  JOIN workspace_members wm ON wm.workspace_id = w.id WHERE wm.user_id = ? ORDER BY w.id
`);
const memberRows = database.prepare(`
  SELECT u.id, u.name, u.email, wm.role FROM workspace_members wm
  JOIN users u ON u.id = wm.user_id WHERE wm.workspace_id = ? ORDER BY CASE wm.role WHEN 'owner' THEN 0 ELSE 1 END, u.name
`);
const memberRole = database.prepare("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?");
const makeWorkspace = database.prepare("INSERT INTO workspaces (name, owner_user_id, created_at) VALUES (?, ?, ?)");
const makeMembership = database.prepare("INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)");
const migrateMembership = database.prepare("SELECT workspace_id FROM workspace_members WHERE user_id = ? ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, workspace_id LIMIT 1");
const setProjectWorkspace = database.prepare("UPDATE projects SET workspace_id = ? WHERE owner_user_id = ? AND workspace_id IS NULL");
for (const user of database.prepare("SELECT id, name FROM users ORDER BY id").all()) {
  runTransaction(() => {
    let membership = migrateMembership.get(user.id);
    if (!membership) {
      const result = makeWorkspace.run(`${user.name}'s workspace`, user.id, Date.now());
      const workspaceId = Number(result.lastInsertRowid);
      makeMembership.run(workspaceId, user.id, "owner", Date.now());
      membership = { workspace_id: workspaceId };
    }
    setProjectWorkspace.run(membership.workspace_id, user.id);
  });
}

const projectSelect = database.prepare(`
  SELECT id, name, description, status, progress, due_date AS dueDate, team_members AS teamMembers
  FROM projects WHERE id = ? AND workspace_id = ?
`);
const allProjectsSelect = database.prepare(`
  SELECT id, name, description, status, progress, due_date AS dueDate, team_members AS teamMembers
  FROM projects WHERE workspace_id = ? ORDER BY id
`);
const taskSelect = database.prepare(`
  SELECT id, id_type AS idType, title, status, priority
  FROM tasks WHERE project_id = ? ORDER BY position, id
`);
const addProjectStatement = database.prepare(`
  INSERT INTO projects (name, description, status, progress, due_date, team_members, owner_user_id, workspace_id)
  VALUES (?, ?, ?, 0, ?, ?, ?, ?)
`);
const updateProjectStatement = database.prepare(`
  UPDATE projects SET name = ?, description = ?, status = ?, due_date = ?, team_members = ?
  WHERE id = ? AND workspace_id = ?
`);
const deleteProjectStatement = database.prepare("DELETE FROM projects WHERE id = ? AND workspace_id = ?");
const nextTaskPosition = database.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM tasks WHERE project_id = ?");
const addTaskStatement = database.prepare(`
  INSERT INTO tasks (id, id_type, project_id, title, status, priority, position)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const findTask = database.prepare("SELECT id FROM tasks WHERE project_id = ? AND id = ?");
const updateTaskStatusStatement = database.prepare("UPDATE tasks SET status = ? WHERE project_id = ? AND id = ?");
const deleteTaskStatement = database.prepare("DELETE FROM tasks WHERE project_id = ? AND id = ?");

const projectStatuses = new Set(["Planning", "In Progress", "Completed"]);
const taskStatuses = new Set(["Todo", "In Progress", "Completed"]);
const priorities = new Set(["Low", "Medium", "High"]);
const userCount = database.prepare("SELECT COUNT(*) AS total FROM users");
const userByEmail = database.prepare("SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ? COLLATE NOCASE");
const userById = database.prepare("SELECT id, name, email FROM users WHERE id = ?");
const addUser = database.prepare("INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)");
const claimUnownedProjects = database.prepare("UPDATE projects SET owner_user_id = ?, workspace_id = ? WHERE workspace_id IS NULL");
const addSession = database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)");
const sessionUser = database.prepare(`
  SELECT users.id, users.name, users.email, sessions.expires_at AS expiresAt
  FROM sessions JOIN users ON users.id = sessions.user_id
  WHERE sessions.token_hash = ?
`);
const deleteSession = database.prepare("DELETE FROM sessions WHERE token_hash = ?");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateProject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Project details must be a JSON object.");
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const status = input.status;
  const dueDate = input.dueDate;
  const teamMembers = input.teamMembers;

  if (!name || name.length > 80) throw new HttpError(400, "Project name must be between 1 and 80 characters.");
  if (!description || description.length > 180) throw new HttpError(400, "Description must be between 1 and 180 characters.");
  if (!projectStatuses.has(status)) throw new HttpError(400, "Choose a valid project status.");
  const parsedDueDate = typeof dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ? new Date(`${dueDate}T00:00:00Z`)
    : null;
  if (!parsedDueDate || Number.isNaN(parsedDueDate.getTime()) || parsedDueDate.toISOString().slice(0, 10) !== dueDate) {
    throw new HttpError(400, "Enter a valid due date in YYYY-MM-DD format.");
  }
  if (!Array.isArray(teamMembers) || teamMembers.length > 20 || teamMembers.some((member) => typeof member !== "string" || !member.trim() || member.length > 60)) {
    throw new HttpError(400, "Team members must be a list of up to 20 names, each 60 characters or fewer.");
  }

  return { name, description, status, dueDate, teamMembers: teamMembers.map((member) => member.trim()) };
}

function validateTask(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Task details must be a JSON object.");
  }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const status = input.status ?? "Todo";
  const priority = input.priority ?? "Medium";
  if (!title || title.length > 120) throw new HttpError(400, "Task title must be between 1 and 120 characters.");
  if (!taskStatuses.has(status)) throw new HttpError(400, "Choose a valid task status.");
  if (!priorities.has(priority)) throw new HttpError(400, "Choose a valid task priority.");
  return { title, status, priority };
}

function serializeTask(row) {
  return {
    id: row.idType === "number" ? Number(row.id) : row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
  };
}

function getProject(id, workspaceId) {
  const project = projectSelect.get(id, workspaceId);
  if (!project) return null;
  return {
    ...project,
    dueDate: project.dueDate || "",
    teamMembers: JSON.parse(project.teamMembers),
    tasks: taskSelect.all(id).map(serializeTask),
  };
}

function getProjects(workspaceId) {
  return allProjectsSelect.all(workspaceId).map((row) => getProject(row.id, workspaceId));
}

function serializeWorkspace(workspace, userId) {
  return { ...workspace, ...(userId ? { role: memberRole.get(workspace.id, userId)?.role } : {}), members: memberRows.all(workspace.id) };
}

function requireWorkspace(request, user) {
  const workspaceId = Number(request.headers["x-workspace-id"]);
  if (!Number.isSafeInteger(workspaceId) || workspaceId < 1) throw new HttpError(400, "Choose a workspace first.");
  if (!memberRole.get(workspaceId, user.id)) throw new HttpError(403, "You are not a member of this workspace.");
  return workspaceId;
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(body));
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readSessionToken(request) {
  const cookies = request.headers.cookie?.split(";") || [];
  const sessionCookie = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith("devflow_session="));
  return sessionCookie?.slice("devflow_session=".length) || "";
}

function sessionCookie(token, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `devflow_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function getAuthenticatedUser(request) {
  const token = readSessionToken(request);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = sessionUser.get(tokenHash);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    deleteSession.run(tokenHash);
    return null;
  }
  const { id, name, email } = session;
  return { id, name, email };
}

function validateEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  return email;
}

async function handleAuth(request, response, parts) {
  const route = parts[2];
  if (route === "me" && request.method === "GET") {
    const user = getAuthenticatedUser(request);
    if (!user) {
      send(response, 401, { error: "Sign in to continue." });
      return true;
    }
    send(response, 200, { user });
    return true;
  }

  if (route === "signup" && request.method === "POST") {
    const input = await readBody(request);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new HttpError(400, "Account details must be a JSON object.");
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const email = validateEmail(input.email);
    const password = typeof input.password === "string" ? input.password : "";
    if (name.length < 2 || name.length > 80) throw new HttpError(400, "Name must be between 2 and 80 characters.");
    if (password.length < 8 || password.length > 128) throw new HttpError(400, "Password must be between 8 and 128 characters.");
    if (userByEmail.get(email)) throw new HttpError(409, "An account with this email already exists.");

    const salt = randomBytes(16);
    const passwordHash = (await scryptAsync(password, salt, 64)).toString("hex");
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    let userId;
    runTransaction(() => {
      const isFirstAccount = userCount.get().total === 0;
      userId = Number(addUser.run(name, email, `${salt.toString("hex")}:${passwordHash}`, Date.now()).lastInsertRowid);
      const workspaceResult = makeWorkspace.run(`${name}'s workspace`, userId, Date.now());
      const workspaceId = Number(workspaceResult.lastInsertRowid);
      makeMembership.run(workspaceId, userId, "owner", Date.now());
      if (isFirstAccount) claimUnownedProjects.run(userId, workspaceId);
      addSession.run(tokenHash, userId, expiresAt);
    });

    send(response, 201, { user: userById.get(userId) }, { "Set-Cookie": sessionCookie(token, 7 * 24 * 60 * 60) });
    return true;
  }

  if (route === "login" && request.method === "POST") {
    const input = await readBody(request);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new HttpError(400, "Sign-in details must be a JSON object.");
    const email = validateEmail(input.email);
    const password = typeof input.password === "string" ? input.password : "";
    const user = userByEmail.get(email);
    if (!user || !password || password.length > 128) throw new HttpError(401, "Email or password is incorrect.");

    const [saltHex, storedHash] = user.passwordHash.split(":");
    const candidateHash = await scryptAsync(password, Buffer.from(saltHex, "hex"), 64);
    if (!timingSafeEqual(candidateHash, Buffer.from(storedHash, "hex"))) {
      throw new HttpError(401, "Email or password is incorrect.");
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    addSession.run(hashToken(token), user.id, expiresAt);
    const { id, name } = user;
    send(response, 200, { user: { id, name, email: user.email } }, { "Set-Cookie": sessionCookie(token, 7 * 24 * 60 * 60) });
    return true;
  }

  if (route === "logout" && request.method === "POST") {
    const token = readSessionToken(request);
    if (token) deleteSession.run(hashToken(token));
    send(response, 200, { ok: true }, { "Set-Cookie": sessionCookie("", 0) });
    return true;
  }

  return false;
}

async function readBody(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new HttpError(413, "Request body is too large.");
  }
  return raw ? JSON.parse(raw) : {};
}

async function handleRequest(request, response) {
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const method = request.method;

  if (parts[0] !== "api") {
    send(response, 404, { error: "Route not found." });
    return;
  }

  if (parts[1] === "auth") {
    const handled = await handleAuth(request, response, parts);
    if (!handled) send(response, 404, { error: "Route not found." });
    return;
  }

  if (parts[1] === "workspaces") {
    const user = getAuthenticatedUser(request);
    if (!user) throw new HttpError(401, "Sign in to continue.");
    if (parts.length === 2 && method === "GET") {
      send(response, 200, userWorkspaces.all(user.id).map(serializeWorkspace));
      return;
    }
    if (parts.length === 2 && method === "POST") {
      const input = await readBody(request);
      const name = typeof input.name === "string" ? input.name.trim() : "";
      if (!name || name.length > 80) throw new HttpError(400, "Workspace name must be between 1 and 80 characters.");
      let workspaceId;
      runTransaction(() => {
        workspaceId = Number(makeWorkspace.run(name, user.id, Date.now()).lastInsertRowid);
        makeMembership.run(workspaceId, user.id, "owner", Date.now());
      });
      send(response, 201, serializeWorkspace(workspaceById.get(workspaceId), user.id));
      return;
    }
    if (parts.length === 4 && parts[3] === "members" && method === "POST") {
      const workspaceId = Number(parts[2]);
      if (!Number.isSafeInteger(workspaceId) || workspaceId < 1) throw new HttpError(400, "Workspace id must be a number.");
      if (memberRole.get(workspaceId, user.id) !== "owner") throw new HttpError(403, "Only workspace owners can add members.");
      const input = await readBody(request);
      const email = validateEmail(input.email);
      const invitedUser = userByEmail.get(email);
      if (!invitedUser) throw new HttpError(404, "No account exists with that email.");
      if (memberRole.get(workspaceId, invitedUser.id)) throw new HttpError(409, "That account is already a workspace member.");
      makeMembership.run(workspaceId, invitedUser.id, "member", Date.now());
      send(response, 201, serializeWorkspace(workspaceById.get(workspaceId), user.id));
      return;
    }
    send(response, 404, { error: "Route not found." });
    return;
  }

  if (parts[1] !== "projects") {
    send(response, 404, { error: "Route not found." });
    return;
  }

  const user = getAuthenticatedUser(request);
  if (!user) {
    send(response, 401, { error: "Sign in to continue." });
    return;
  }

  const workspaceId = requireWorkspace(request, user);

  if (parts.length === 2 && method === "GET") {
    send(response, 200, getProjects(workspaceId));
    return;
  }

  if (parts.length === 2 && method === "POST") {
    const project = validateProject(await readBody(request));
    const result = addProjectStatement.run(project.name, project.description, project.status, project.dueDate, JSON.stringify(project.teamMembers), user.id, workspaceId);
    send(response, 201, getProject(Number(result.lastInsertRowid), workspaceId));
    return;
  }

  const projectId = Number(parts[2]);
  if (!Number.isSafeInteger(projectId)) {
    send(response, 400, { error: "Project id must be a number." });
    return;
  }

  if (parts.length === 3 && method === "PUT") {
    if (!getProject(projectId, workspaceId)) {
      send(response, 404, { error: "Project not found." });
      return;
    }
    const project = validateProject(await readBody(request));
    updateProjectStatement.run(project.name, project.description, project.status, project.dueDate, JSON.stringify(project.teamMembers), projectId, workspaceId);
    send(response, 200, getProject(projectId, workspaceId));
    return;
  }

  if (parts.length === 3 && method === "DELETE") {
    const result = deleteProjectStatement.run(projectId, workspaceId);
    send(response, result.changes ? 200 : 404, result.changes ? { id: projectId } : { error: "Project not found." });
    return;
  }

  if (parts[3] === "tasks" && parts.length === 4 && method === "POST") {
    if (!getProject(projectId, workspaceId)) {
      send(response, 404, { error: "Project not found." });
      return;
    }
    const input = await readBody(request);
    const task = validateTask(input);
    const requestedId = input.id ?? randomUUID();
    if (typeof requestedId === "string" && (!requestedId.trim() || requestedId.length > 100)) {
      throw new HttpError(400, "Task id must be between 1 and 100 characters.");
    }
    if (typeof requestedId === "number" && !Number.isSafeInteger(requestedId)) {
      throw new HttpError(400, "Numeric task ids must be safe integers.");
    }
    if (typeof requestedId !== "string" && typeof requestedId !== "number") {
      throw new HttpError(400, "Task id must be text or a number.");
    }
    const id = String(requestedId);
    if (findTask.get(projectId, id)) throw new HttpError(409, "A task with this id already exists.");
    const position = nextTaskPosition.get(projectId).position;
    addTaskStatement.run(id, typeof requestedId, projectId, task.title, task.status, task.priority, position);
    send(response, 201, getProject(projectId, workspaceId));
    return;
  }

  if (parts[3] === "tasks" && parts[4] && parts.length === 5) {
    if (!getProject(projectId, workspaceId)) {
      send(response, 404, { error: "Project not found." });
      return;
    }
    const taskId = decodeURIComponent(parts[4]);
    if (!findTask.get(projectId, taskId)) {
      send(response, 404, { error: "Task not found." });
      return;
    }

    if (method === "PATCH") {
      const input = await readBody(request);
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => key !== "status")) {
        throw new HttpError(400, "Only a task status can be changed here.");
      }
      if (!taskStatuses.has(input.status)) throw new HttpError(400, "Choose a valid task status.");
      updateTaskStatusStatement.run(input.status, projectId, taskId);
      send(response, 200, getProject(projectId, workspaceId));
      return;
    }
    if (method === "DELETE") {
      deleteTaskStatement.run(projectId, taskId);
      send(response, 200, getProject(projectId, workspaceId));
      return;
    }
  }

  send(response, 404, { error: "Route not found." });
}

const server = createServer(async (request, response) => {
  try {
    await handleRequest(request, response);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : error instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error(error);
    const message = error instanceof HttpError ? error.message : status === 400 ? "Invalid JSON request body." : "The server could not complete the request.";
    send(response, status, { error: message });
  }
});

const port = Number(process.env.API_PORT || 3001);
server.listen(port, () => console.log(`DevFlow API listening at http://localhost:${port}`));
