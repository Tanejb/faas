import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { canOrganize, isAdmin } from "../utils/roles";

export default function AppShell() {
  const { user, logout } = useAuth();
  const { role } = useProfile();

  return (
    <div className="app">
      <header className="app-header row">
        <div>
          <h1>
            <NavLink to="/events" className="brand-link">
              CampusHub
            </NavLink>
          </h1>
          <p className="subtitle">
            {user?.email}
            {role ? ` · ${role}` : ""}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => logout()}>
          Log out
        </button>
      </header>

      <nav className="main-nav">
        <NavLink to="/events" className={({ isActive }) => (isActive ? "active" : "")}>
          Events
        </NavLink>
        <NavLink to="/account" className={({ isActive }) => (isActive ? "active" : "")}>
          Account
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Notifications
        </NavLink>
        {canOrganize(role) && (
          <NavLink
            to="/organize"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Organize
          </NavLink>
        )}
        {isAdmin(role) && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
            Admin
          </NavLink>
        )}
      </nav>

      <Outlet />
    </div>
  );
}
