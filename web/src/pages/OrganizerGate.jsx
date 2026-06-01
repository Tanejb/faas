import { Link } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { canOrganize } from "../utils/roles";
import OrganizerPage from "./OrganizerPage";

export default function OrganizerGate({ children }) {
  const { role, loading } = useProfile();

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  if (!canOrganize(role)) {
    return (
      <section className="card">
        <h2>Organize</h2>
        <p className="error">Organizer access is required to create events.</p>
        <p className="muted">Ask an admin to grant you the organizer role.</p>
        <Link to="/events" className="btn btn-ghost" style={{ marginTop: "1rem" }}>
          ← Events
        </Link>
      </section>
    );
  }

  return children || <OrganizerPage />;
}
