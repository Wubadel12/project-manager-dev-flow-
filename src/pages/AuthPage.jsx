import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "./AuthPage.css";

function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { signup, login, error: authError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    const success = isSignup
      ? await signup({ name, email, password })
      : await login({ email, password });
    setSubmitting(false);
    if (success) navigate("/", { replace: true });
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/login" aria-label="DevFlow sign in">
          <span className="auth-brand-mark">D</span><span>devflow</span>
        </Link>
        <p className="auth-eyebrow">YOUR WORKSPACE, IN ONE PLACE</p>
        <h1 id="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-intro">{isSignup ? "Create an account for this local DevFlow demo." : "Sign in to your local DevFlow demo account."}</p>

        {isSignup && <div className="auth-workspace-note">Demo accounts stay in this browser only. Do not use a real password; this app has no backend authentication.</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && <label>Full name<input autoComplete="name" maxLength={80} minLength={2} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}
          <label>Email address<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "At least 8 characters" : "Your password"} /></label>
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</button>
        </form>

        <p className="auth-switch">{isSignup ? "Already have an account?" : "New to DevFlow?"} <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
        <p className="auth-security-note">This local demo stores account data in your browser and does not sync between devices.</p>
      </section>
    </main>
  );
}

export default AuthPage;
