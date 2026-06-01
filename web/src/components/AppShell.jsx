import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useTheme } from "../context/ThemeContext";
import { useInbox } from "../hooks/useInbox";
import { canOrganize, isAdmin } from "../utils/roles";

export default function AppShell() {
  const { user, logout } = useAuth();
  const { role } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useInbox();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <NavLink to="/events" className="brand">
            CampusHub
          </NavLink>
          <p className="header-meta">
            {user?.email}
            {role && (
              <>
                {" · "}
                <span className="role-pill">{role}</span>
              </>
            )}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      <nav className="main-nav">
        <NavLink
          to="/events"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Events
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Inbox
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </NavLink>
        <NavLink
          to="/account"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Account
        </NavLink>
        {canOrganize(role) && (
          <NavLink
            to="/organize"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Organize
          </NavLink>
        )}
        {isAdmin(role) && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Admin
          </NavLink>
        )}
      </nav>

      <Outlet />
    </div>
  );
}
