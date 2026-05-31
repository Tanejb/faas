import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import MaterialUploadForm from "../components/MaterialUploadForm";
import MaterialsList from "../components/MaterialsList";

export default function OrganizerMaterialsPage() {
  const { eventId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploaded() {
    setTimeout(() => setRefreshKey((k) => k + 1), 800);
  }

  return (
    <>
      <p className="back-link">
        <Link to="/organize">← Back to organize</Link>
      </p>

      <section className="card">
        <h2>Event materials</h2>
        <p className="hint">
          Event <code>{eventId}</code> — upload via Storage SDK +{" "}
          <code>getUploadUrl</code>.
        </p>
        <MaterialUploadForm eventId={eventId} onUploaded={handleUploaded} />
      </section>

      <section className="card">
        <h3>Uploaded files</h3>
        <MaterialsList eventId={eventId} refreshKey={refreshKey} />
      </section>
    </>
  );
}
