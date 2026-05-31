import { useState } from "react";
import { Link } from "react-router-dom";
import * as adminApi from "../api/admin";
import { getCallableErrorMessage } from "../api/callable";
import { useAuth } from "../context/AuthContext";

const ROLES = ["student", "organizer", "admin"];

export default function AdminPage() {
  const { user } = useAuth();
  const [uid, setUid] = useState("");
  const [role, setRole] = useState("organizer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const data = await adminApi.setUserRole({
        uid: uid.trim(),
        role,
      });
      setResult(data);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Change user role</h2>
        <p className="hint">
          Callable <code>setUserRole</code> — updates Firestore and Auth custom
          claims. Copy target UID from Emulator UI → Auth.
        </p>
        <p className="hint">
          Your UID: <code>{user?.uid}</code>
        </p>

        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            User UID
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Paste user UID from Auth emulator"
              required
            />
          </label>
          <label>
            New role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          {result && (
            <p className="success">
              Updated <code>{result.uid}</code> → role{" "}
              <strong>{result.role}</strong>. User should refresh the app to see
              new permissions.
            </p>
          )}
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Set role"}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Automation</h3>
        <p className="hint">Cron job results stored in Firestore collection reports.</p>
        <Link to="/admin/reports" className="link-btn">
          View automation reports →
        </Link>
      </section>
    </>
  );
}
