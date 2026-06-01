import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import MaterialUploadForm from "../components/MaterialUploadForm";
import MaterialsList from "../components/MaterialsList";

export default function OrganizerMaterialsPage() {
  const { eventId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [pollUntil, setPollUntil] = useState(0);

  function handleUploaded() {
    setRefreshKey((k) => k + 1);
    setPollUntil(Date.now() + 30000);
  }

  return (
    <>
      <p className="back-link">
        <Link to="/organize">← Organize</Link>
      </p>

      <section className="card">
        <h2>Materials</h2>
        <p className="muted">Upload slides, PDFs, or other files for attendees.</p>
        <MaterialUploadForm eventId={eventId} onUploaded={handleUploaded} />
      </section>

      <section className="card">
        <h3>Uploaded files</h3>
        <MaterialsList
          eventId={eventId}
          refreshKey={refreshKey}
          pollUntil={pollUntil}
        />
      </section>
    </>
  );
}
