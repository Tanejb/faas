import { useCallback, useEffect, useState } from "react";
import * as adminApi from "../api/admin";
import { getCallableErrorMessage } from "../api/callable";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function formatLastRun(ts) {
  if (!ts?.toDate) return "Never";
  return ts.toDate().toLocaleString();
}

function formatRemindersResult(result) {
  if (result.remindersSent > 0) {
    return `Reminders sent for ${result.remindersSent} event(s).`;
  }
  const closest = result.closestEvent;
  const mins = closest?.msUntilStart
    ? Math.round(closest.msUntilStart / 60000)
    : null;
  let detail = `No reminders sent (checked ${result.publishedChecked ?? 0} published, using ${result.hoursUsed ?? "?"}h window). `;
  detail += `Too early: ${result.skippedTooEarly ?? 0}, already started: ${result.skippedAlreadyStarted ?? 0}. `;
  if (closest) {
    detail += `Nearest: "${closest.title}" starts in ${mins} min (${closest.reason}). `;
  }
  detail +=
    "Event must be published, start in the future, and within the next X hours. Save settings before Run now.";
  return detail;
}

export default function AdminAutomationSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getAutomationSettings();
      setSettings(data);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await adminApi.updateAutomationSettings({
        reminderHoursBefore: Number(settings.reminderHoursBefore),
        reminderRunHour: Number(settings.reminderRunHour),
        archiveAfterDays: Number(settings.archiveAfterDays),
        archiveRunHour: Number(settings.archiveRunHour),
        archiveRunDayOfWeek: Number(settings.archiveRunDayOfWeek),
        weeklyReportDayOfWeek: Number(settings.weeklyReportDayOfWeek),
        weeklyReportRunHour: Number(settings.weeklyReportRunHour),
        emailEnabled: Boolean(settings.emailEnabled),
      });
      setSettings(data);
      setMessage("Settings saved.");
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRun(job) {
    setRunning(job);
    setError("");
    setMessage("");
    try {
      const result = await adminApi.runAutomationJob({
        job,
        settings: {
          reminderHoursBefore: Number(settings.reminderHoursBefore),
          emailEnabled: settings.emailEnabled !== false,
        },
      });
      setMessage(
        job === "reminders"
          ? formatRemindersResult(result)
          : job === "eventStarted"
            ? `Started notifications sent for ${result.startedNotificationsSent ?? 0} event(s).`
            : job === "archive"
              ? `Archived ${result.archivedCount ?? 0} event(s).`
              : `Weekly report generated (week ${result.week || "—"}).`
      );
      await load();
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setRunning(null);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <h3>Automation</h3>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="card">
        <h3>Automation</h3>
        <p className="error">{error || "Could not load settings."}</p>
        <button type="button" className="btn btn-ghost" onClick={load}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h3>Automation</h3>
      <p className="muted">
        <strong>Save settings</strong> only stores values — it does not send messages.
        Use the run buttons to test immediately.
      </p>

      <form onSubmit={handleSave} className="form">
        <fieldset className="form-fieldset">
          <legend>Event reminders (before start)</legend>
          <div className="form-row">
            <label>
              Hours before start
              <input
                type="number"
                min={1}
                max={168}
                value={settings.reminderHoursBefore}
                onChange={(e) =>
                  updateField("reminderHoursBefore", e.target.value)
                }
              />
            </label>
            <label>
              Run at hour (0–23)
              <input
                type="number"
                min={0}
                max={23}
                value={settings.reminderRunHour}
                onChange={(e) => updateField("reminderRunHour", e.target.value)}
              />
            </label>
          </div>
          <p className="muted small">
            <strong>Hours before start</strong> — sends for published events that start
            within the next X hours (e.g. now 17:49, start 18:00, X = 1 → yes). Save
            settings, then Run reminders now.
            <br />
            <strong>Run at hour</strong> — only for automatic hourly scheduler, not
            &quot;Run reminders now&quot;.
            <br />
            Last automatic run: {formatLastRun(settings.lastRuns?.reminders)}
          </p>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Event started</legend>
          <p className="muted small">
            Notifies registered students when the event start time has passed (checked
            every hour). Manual run sends for events that started within the last hour.
          </p>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Archive old events</legend>
          <div className="form-row">
            <label>
              Days after end date
              <input
                type="number"
                min={1}
                max={365}
                value={settings.archiveAfterDays}
                onChange={(e) =>
                  updateField("archiveAfterDays", e.target.value)
                }
              />
            </label>
            <label>
              Run at hour
              <input
                type="number"
                min={0}
                max={23}
                value={settings.archiveRunHour}
                onChange={(e) => updateField("archiveRunHour", e.target.value)}
              />
            </label>
            <label>
              Day of week
              <select
                value={settings.archiveRunDayOfWeek}
                onChange={(e) =>
                  updateField("archiveRunDayOfWeek", e.target.value)
                }
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted small">
            Last run: {formatLastRun(settings.lastRuns?.archive)}
          </p>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Weekly report</legend>
          <div className="form-row">
            <label>
              Day of week
              <select
                value={settings.weeklyReportDayOfWeek}
                onChange={(e) =>
                  updateField("weeklyReportDayOfWeek", e.target.value)
                }
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Run at hour
              <input
                type="number"
                min={0}
                max={23}
                value={settings.weeklyReportRunHour}
                onChange={(e) =>
                  updateField("weeklyReportRunHour", e.target.value)
                }
              />
            </label>
          </div>
          <p className="muted small">
            Last run: {formatLastRun(settings.lastRuns?.weeklyReport)}
          </p>
        </fieldset>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.emailEnabled !== false}
            onChange={(e) => updateField("emailEnabled", e.target.checked)}
          />
          Send email copies when SMTP is configured
        </label>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={running === "reminders"}
            onClick={() => handleRun("reminders")}
          >
            {running === "reminders" ? "Running…" : "Run reminders now"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={running === "eventStarted"}
            onClick={() => handleRun("eventStarted")}
          >
            {running === "eventStarted" ? "Running…" : "Run event started now"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={running === "archive"}
            onClick={() => handleRun("archive")}
          >
            {running === "archive" ? "Running…" : "Run archive now"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={running === "weeklyReport"}
            onClick={() => handleRun("weeklyReport")}
          >
            {running === "weeklyReport" ? "Running…" : "Run weekly report"}
          </button>
        </div>
      </form>
    </section>
  );
}
