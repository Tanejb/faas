import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as eventsApi from "../api/events";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const list = await eventsApi.listEvents();
        if (!cancelled) setEvents(list);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card">
      <h2>Published events</h2>
      <p className="hint">Public list from <code>listEvents</code> (HTTP GET).</p>

      {loading && <p className="muted">Loading events…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="muted">No published events yet.</p>
      )}

      <ul className="event-list">
        {events.map((ev) => (
          <li key={ev.eventId} className="event-item">
            <Link to={`/events/${ev.eventId}`} className="event-link">
              <span className="event-title">{ev.title}</span>
              <span className="event-meta">
                {formatDate(ev.startAt)} · capacity {ev.capacity}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
