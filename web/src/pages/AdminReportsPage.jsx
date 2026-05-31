import { Link } from "react-router-dom";
import ReportsList from "../components/ReportsList";

export default function AdminReportsPage() {
  return (
    <>
      <p className="back-link">
        <Link to="/admin">← Back to admin</Link>
      </p>
      <section className="card">
        <h2>Automation reports</h2>
        <p className="hint">
          Output from <code>sendEventReminders</code>,{" "}
          <code>archiveOldEvents</code>, and <code>generateWeeklyReport</code>.
        </p>
      </section>
      <ReportsList />
    </>
  );
}
