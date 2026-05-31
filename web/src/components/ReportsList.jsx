import { useCallback, useEffect, useState } from "react";
import * as adminApi from "../api/admin";
import { getCallableErrorMessage } from "../api/callable";

function formatTime(value) {
  if (!value) return "—";
  if (value.toDate) return value.toDate().toLocaleString();
  return "—";
}

function reportSummary(report) {
  switch (report.type) {
    case "daily_reminders":
      return `Reminders sent: ${report.remindersSent ?? 0}`;
    case "archive_old_events":
      return `Events archived: ${report.archivedCount ?? 0}`;
    case "weekly_registrations":
      return `Week ${report.week || "—"} — registered: ${
        report.totalRegistrations ?? 0
      }, cancelled: ${report.totalCancelled ?? 0}`;
    default:
      return JSON.stringify(report);
  }
}

const CRON_INFO = [
  {
    fn: "sendEventReminders",
    schedule: "every day 08:00",
    reportType: "daily_reminders",
  },
  {
    fn: "archiveOldEvents",
    schedule: "every sunday 03:00",
    reportType: "archive_old_events",
  },
  {
    fn: "generateWeeklyReport",
    schedule: "every monday 07:00",
    reportType: "weekly_registrations",
  },
];

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
    <>
      <section className="card">
        <h3>Scheduled jobs (cron)</h3>
        <p className="hint">
          Run manually in Emulator UI → Functions → Run function, then refresh
          this list.
        </p>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Function</th>
              <th>Schedule</th>
              <th>Report type</th>
            </tr>
          </thead>
          <tbody>
            {CRON_INFO.map((row) => (
              <tr key={row.fn}>
                <td>
                  <code>{row.fn}</code>
                </td>
                <td>{row.schedule}</td>
                <td>
                  <code>{row.reportType}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="card-title-row">
          <h3>Report history</h3>
          <button type="button" className="btn-secondary" onClick={load}>
            Refresh
          </button>
        </div>
        {loading && <p className="muted">Loading reports…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && reports.length === 0 && (
          <p className="muted">
            No reports yet. Run a scheduled function from the emulator.
          </p>
        )}
        <ul className="reports-list">
          {reports.map((r) => (
            <li key={r.reportId} className="report-item">
              <strong>{r.type}</strong>
              <span className="report-detail">{reportSummary(r)}</span>
              <span className="report-time">{formatTime(r.generatedAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
