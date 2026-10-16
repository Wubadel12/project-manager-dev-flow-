const usersKey = "devflow-demo-users";
const sessionKey = "devflow-demo-session";

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(usersKey) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function publicUser({ id, name, email }) {
  return { id, name, email };
}

async function passwordDigest(password, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function saveSession(user) {
  localStorage.setItem(sessionKey, user.id);
  return { user: publicUser(user) };
}

export const authApi = {
  async me() {
    const id = localStorage.getItem(sessionKey);
    const user = readUsers().find((item) => item.id === id);
    if (!user) throw Object.assign(new Error("No local demo session."), { status: 401 });
    return { user: publicUser(user) };
  },

  async signup({ name, email, password }) {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const users = readUsers();
    if (users.some((user) => user.email === cleanEmail)) throw new Error("An account with this email already exists in this browser.");
    const id = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await passwordDigest(password, salt);
    const user = { id, name: cleanName, email: cleanEmail, salt, passwordHash };
    localStorage.setItem(usersKey, JSON.stringify([...users, user]));
    return saveSession(user);
  },

  async login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const user = readUsers().find((item) => item.email === cleanEmail);
    if (!user || await passwordDigest(password, user.salt) !== user.passwordHash) {
      throw new Error("Email or password is incorrect for an account saved in this browser.");
    }
    return saveSession(user);
  },

  async logout() {
    localStorage.removeItem(sessionKey);
    return { ok: true };
  },
};
