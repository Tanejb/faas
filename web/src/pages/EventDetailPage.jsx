import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EventRegistration from "../components/EventRegistration";
import MaterialsList from "../components/MaterialsList";
import NotificationsList from "../components/NotificationsList";
import * as eventsApi from "../api/events";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await eventsApi.getEventDetails(eventId);
        if (!cancelled) setEvent(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load event");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <>
      <p className="back-link">
        <Link to="/events">← Back to events</Link>
      </p>

      <section className="card">
        {loading && <p className="muted">Loading event…</p>}
        {error && <p className="error">{error}</p>}

        {event && (
          <>
            <h2>{event.title}</h2>
            <span className="status-pill published">{event.status}</span>
            <p className="event-description">{event.description}</p>
            <dl className="detail-grid">
              <dt>Starts</dt>
              <dd>{formatDate(event.startAt)}</dd>
              <dt>Ends</dt>
              <dd>{formatDate(event.endAt)}</dd>
              <dt>Capacity</dt>
              <dd>{event.capacity}</dd>
              <dt>Event ID</dt>
              <dd>
                <code>{event.eventId}</code>
              </dd>
            </dl>
          </>
        )}
      </section>

      {event && event.status === "published" && (
        <>
          <section className="card">
            <h3>Materials</h3>
            <MaterialsList eventId={event.eventId} />
          </section>
          <section className="card">
            <h3>Notifications</h3>
            <NotificationsList eventId={event.eventId} />
          </section>
          <EventRegistration eventId={event.eventId} />
        </>
      )}
    </>
  );
}
