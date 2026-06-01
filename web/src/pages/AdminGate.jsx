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
        <p className="error">You don&apos;t have admin access.</p>
        <p className="muted">
          Contact an administrator if you need to manage users or automation.
        </p>
        <Link to="/events" className="btn btn-ghost" style={{ marginTop: "1rem" }}>
          ← Events
        </Link>
      </section>
    );
  }

  return children || <AdminPage />;
}
