import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/layout/layout"
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import Projects from "./pages/Projects";
import Setting from "./pages/Setting";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import AuthPage from "./pages/AuthPage";
import useAuth from "./hooks/useAuth";


function App(){
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <main className="auth-loading">Checking your session…</main>;

  if (!user) {
    if (location.pathname === "/signup") return <AuthPage mode="signup" />;
    if (location.pathname === "/login") return <AuthPage mode="login" />;
    return <Navigate to="/login" replace />;
  }

  return(
    <Routes>
     <Route path="/login" element={<Navigate to="/" replace/>}/>
     <Route path="/signup" element={<Navigate to="/" replace/>}/>
     <Route path="/" element={<Layout/>}>
      <Route index  element={<Dashboard/>}/>
      <Route path="/projects" element={<Projects/>}/>
      <Route path="/projects/:id" element={<ProjectDetails/>}/>
      <Route path="/settings" element={<Setting/>}/>
      <Route path="/setting" element={<Setting/>}/>
      <Route path="/tasks" element={<Tasks/>}/>
      <Route path="/team" element={<Team/>}/>
     </Route>
     <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  )
}

export default App
