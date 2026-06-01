import { Link } from "react-router-dom";
import ReportsList from "../components/ReportsList";

export default function AdminReportsPage() {
  return (
    <>
      <p className="back-link">
        <Link to="/admin">← Admin</Link>
      </p>
      <section className="card">
        <h2>Automation reports</h2>
        <p className="muted">
          Results from scheduled reminders, archiving, and weekly registration
          summaries.
        </p>
      </section>
      <ReportsList />
    </>
  );
}
