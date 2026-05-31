import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import EnqueueNotificationForm from "../components/EnqueueNotificationForm";
import NotificationsList from "../components/NotificationsList";

export default function OrganizerNotifyPage() {
  const { eventId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <p className="back-link">
        <Link to="/organize">← Back to organize</Link>
      </p>

      <section className="card">
        <h2>Send notification</h2>
        <p className="hint">Event <code>{eventId}</code></p>
        <EnqueueNotificationForm
          eventId={eventId}
          onSent={() => setRefreshKey((k) => k + 1)}
        />
      </section>

      <section className="card">
        <h3>Notifications for this event</h3>
        <NotificationsList eventId={eventId} refreshKey={refreshKey} />
      </section>
    </>
  );
}
