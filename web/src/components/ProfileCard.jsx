import { useEffect, useState } from "react";
import { getCallableErrorMessage } from "../api/callable";
import { useProfile } from "../context/ProfileContext";

export default function ProfileCard() {
  const { profile, loading, error, loadProfile, saveProfile, role } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setFaculty(profile.faculty || "");
    }
  }, [profile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await saveProfile({
        displayName: displayName.trim(),
        faculty: faculty.trim(),
      });
      setSaved(true);
    } catch (err) {
      setSaveError(getCallableErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <h2>Profile</h2>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="card">
        <h2>Profile</h2>
        <p className="error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => loadProfile()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-header-row">
        <h2>Profile</h2>
        {role && <span className="role-pill">{role}</span>}
      </div>
      <p className="muted">{profile?.email}</p>

      <form onSubmit={handleSubmit} className="form" style={{ marginTop: "1rem" }}>
        <label>
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={120}
          />
        </label>
        <label>
          Faculty
          <input
            type="text"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            maxLength={120}
            placeholder="e.g. FERI"
          />
        </label>
        {saveError && <p className="error">{saveError}</p>}
        {saved && <p className="success">Profile saved.</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}
