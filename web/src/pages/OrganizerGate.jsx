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
        <h2>Organizer tools</h2>
        <p className="error">
          Your role is <strong>{role || "unknown"}</strong>. Only organizers and
          admins can create and publish events.
        </p>
        <p className="hint">
          For local testing, set <code>role</code> to <code>organizer</code> in
          Firestore (<code>users/{"{uid}"}</code>) or ask an admin to use{" "}
          <code>setUserRole</code> (F7).
        </p>
        <Link to="/events">← Back to events</Link>
      </section>
    );
  }

  return children || <OrganizerPage />;
}
