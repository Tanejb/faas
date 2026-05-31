import { Link } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { isAdmin } from "../utils/roles";
import AdminPage from "./AdminPage";

export default function AdminGate({ children }) {
  const { role, loading } = useProfile();

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  if (!isAdmin(role)) {
    return (
      <section className="card">
        <h2>Admin</h2>
        <p className="error">
          Admin access only. Your role: <strong>{role || "unknown"}</strong>.
        </p>
        <p className="hint">
          For local testing, set <code>role</code> to <code>admin</code> in
          Firestore for your user, then refresh the page.
        </p>
        <Link to="/events">← Back to events</Link>
      </section>
    );
  }

  return children || <AdminPage />;
}
