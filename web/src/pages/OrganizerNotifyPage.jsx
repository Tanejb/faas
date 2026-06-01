import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import EnqueueNotificationForm from "../components/EnqueueNotificationForm";
import InboxList from "../components/InboxList";
import { useInbox } from "../hooks/useInbox";

export default function OrganizerNotifyPage() {
  const { eventId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const { refreshInbox } = useInbox();

  return (
    <>
      <p className="back-link">
        <Link to="/organize">← Organize</Link>
      </p>
      <section className="card">
        <h2>Notify attendees</h2>
        <p className="muted">Message goes to registered students and their email.</p>
        <EnqueueNotificationForm
          eventId={eventId}
          onSent={() => {
            setRefreshKey((k) => k + 1);
            refreshInbox();
          }}
        />
      </section>
      <section className="card">
        <h3>Recent messages</h3>
        <InboxList eventId={eventId} refreshKey={refreshKey} />
      </section>
    </>
  );
}
