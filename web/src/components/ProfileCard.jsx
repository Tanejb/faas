import { useEffect, useState } from "react";
import { getCallableErrorMessage } from "../api/callable";
import { useProfile } from "../context/ProfileContext";

export default function ProfileCard() {
  const { profile, loading, error, loadProfile, saveProfile } = useProfile();
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
        <h2>My profile</h2>
        <p className="muted">Loading profile…</p>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="card">
        <h2>My profile</h2>
        <p className="error">{error}</p>
        <button type="button" onClick={() => loadProfile()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-title-row">
        <h2>My profile</h2>
        {profile?.role && (
          <span className={`role-badge role-${profile.role}`}>
            {profile.role}
          </span>
        )}
      </div>

      <ul className="meta profile-meta">
        <li>
          <strong>Email:</strong> {profile?.email || "—"}
        </li>
        <li>
          <strong>UID:</strong> <code>{profile?.uid}</code>
        </li>
      </ul>

      <form onSubmit={handleSubmit} className="profile-form">
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
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}
