import { Outlet } from "react-router-dom"
import Sidebar from "./sidebar"
import Navbar from "./navbar"
import useProject from "../../hooks/useProject";
import "./layout.css";

function Layout(){
    const { state } = useProject();

    return(
        <div className="app-layout">
            <Sidebar/>

            <div className="main-content">
                <Navbar/>

                <div className="route-content">
                    {state.error && <div className="api-error" role="alert">{state.error}</div>}
                    {state.loading ? <div className="api-loading" role="status">Loading project data…</div> : <Outlet/>}
                </div>
            </div>
        </div>
    )
}

export default Layout
