import { useCallback, useEffect, useState } from "react";
import * as adminApi from "../api/admin";
import { getCallableErrorMessage } from "../api/callable";

function formatTime(value) {
  if (!value) return "—";
  if (value.toDate) return value.toDate().toLocaleString();
  return "—";
}

function reportLabel(type) {
  switch (type) {
    case "daily_reminders":
      return "Event reminders";
    case "archive_old_events":
      return "Archive";
    case "weekly_registrations":
      return "Weekly registrations";
    case "event_started":
      return "Event started";
    default:
      return type;
  }
}

function reportSummary(report) {
  switch (report.type) {
    case "daily_reminders":
      return `${report.remindersSent ?? 0} reminder(s) sent`;
    case "archive_old_events":
      return `${report.archivedCount ?? 0} event(s) archived`;
    case "weekly_registrations":
      return `Week ${report.week || "—"} — ${report.totalRegistrations ?? 0} active, ${
        report.totalCancelled ?? 0
      } cancelled`;
    case "event_started":
      return `${report.startedNotificationsSent ?? 0} notification(s) sent`;
    default:
      return "Completed";
  }
}

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listReports();
      setReports(data.reports || []);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="card">
      <div className="card-header-row">
        <h3>Automation history</h3>
        <button type="button" className="btn btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && reports.length === 0 && (
        <p className="muted">No reports yet. Run a job from Admin → Automation.</p>
      )}
      <ul className="reports-list">
        {reports.map((r) => (
          <li key={r.reportId} className="report-item">
            <strong>{reportLabel(r.type)}</strong>
            <span className="report-detail">{reportSummary(r)}</span>
            <span className="report-time">{formatTime(r.generatedAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
