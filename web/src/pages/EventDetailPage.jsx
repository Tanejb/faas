import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EventRegistration from "../components/EventRegistration";
import InboxList from "../components/InboxList";
import MaterialsList from "../components/MaterialsList";
import * as eventsApi from "../api/events";
import { useInbox } from "../hooks/useInbox";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const { refreshInbox } = useInbox();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await eventsApi.getEventDetails(eventId);
      setEvent(data);
    } catch (err) {
      setError(err.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  function handleRegistrationChange(stats) {
    if (!stats) return;
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            registeredCount: stats.registeredCount,
            spotsLeft: stats.spotsLeft,
          }
        : prev
    );
    refreshInbox();
  }

  const registered = event?.registeredCount ?? 0;
  const capacity = event?.capacity ?? 0;
  const spotsLeft =
    event?.spotsLeft ?? Math.max(0, capacity - registered);
  const isFull = capacity > 0 && spotsLeft <= 0;

  return (
    <>
      <p className="back-link">
        <Link to="/events">← All events</Link>
      </p>

      <section className="card">
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error}</p>}
        {event && (
          <>
            <span className="status-pill published">Published</span>
            <h2>{event.title}</h2>
            <p className="event-description">{event.description}</p>
            <dl className="detail-grid">
              <dt>Starts</dt>
              <dd>{formatDate(event.startAt)}</dd>
              <dt>Ends</dt>
              <dd>{formatDate(event.endAt)}</dd>
              <dt>Spots</dt>
              <dd>
                {registered} / {capacity} registered
                {isFull ? " · Full" : ` · ${spotsLeft} left`}
              </dd>
            </dl>
          </>
        )}
      </section>

      {event && (
        <>
          <section className="card">
            <h3>Materials</h3>
            <MaterialsList eventId={event.eventId} />
          </section>
          <section className="card">
            <h3>Updates</h3>
            <InboxList eventId={event.eventId} />
          </section>
          <EventRegistration
            eventId={event.eventId}
            onRegistrationChange={handleRegistrationChange}
          />
        </>
      )}
    </>
  );
}
