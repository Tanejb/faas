import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCallableErrorMessage } from "../api/callable";
import * as notificationsApi from "../api/notifications";

function formatTime(value) {
  if (!value) return "—";
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }
  if (value.toDate) {
    return value.toDate().toLocaleString();
  }
  return "—";
}

export default function NotificationsList({ eventId = null, refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await notificationsApi.listNotifications(
        eventId ? { eventId } : {}
      );
      setItems(data.notifications || []);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return <p className="muted">Loading notifications…</p>;
  }

  if (error) {
    return (
      <>
        <p className="error">{error}</p>
        <button type="button" onClick={load}>
          Retry
        </button>
      </>
    );
  }

  if (items.length === 0) {
    return <p className="muted">No notifications yet.</p>;
  }

  return (
    <ul className="notifications-list">
      {items.map((n) => (
        <li key={n.notificationId} className="notification-item">
          <div className="notification-header">
            <strong>{n.title}</strong>
            <span className="notification-type">{n.type || "generic"}</span>
          </div>
          <p className="notification-body">{n.body}</p>
          <p className="notification-meta">
            {formatTime(n.publishedAt || n.createdAt)}
            {n.eventId && (
              <>
                {" · "}
                <Link to={`/events/${n.eventId}`}>Event</Link>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
