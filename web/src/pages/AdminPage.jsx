import { useState } from "react";
import { Link } from "react-router-dom";
import AdminAutomationSettings from "../components/AdminAutomationSettings";
import * as adminApi from "../api/admin";
import { getCallableErrorMessage } from "../api/callable";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "organizer", label: "Organizer" },
  { value: "admin", label: "Admin" },
];

export default function AdminPage() {
  const [uid, setUid] = useState("");
  const [role, setRole] = useState("organizer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const data = await adminApi.setUserRole({
        uid: uid.trim(),
        role,
      });
      setSuccess(`Role updated to ${data.role}. The user should sign out and back in.`);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>User roles</h2>
        <p className="muted">
          Assign organizer or admin access. You need the user&apos;s account ID from
          Firebase Auth (or ask them to copy it from their account page if you add
          that later).
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label>
            User ID
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Paste user ID"
              required
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Update role"}
          </button>
        </form>
      </section>

      <AdminAutomationSettings />

      <section className="card">
        <h3>Reports</h3>
        <p className="muted">History of automated reminder, archive, and weekly jobs.</p>
        <Link to="/admin/reports" className="btn btn-ghost">
          View reports →
        </Link>
      </section>
    </>
  );
}
