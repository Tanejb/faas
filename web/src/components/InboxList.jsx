import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCallableErrorMessage } from "../api/callable";
import * as notificationsApi from "../api/notifications";
import { useInbox } from "../context/InboxContext";
import { loadInbox, markAllRead } from "../hooks/useInbox";

function formatTime(value) {
  if (!value) return "";
  if (value.toDate) return value.toDate().toLocaleString();
  return "";
}

export default function InboxList({ eventId = null, refreshKey = 0 }) {
  const { refreshInbox } = useInbox();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let list = await loadInbox();
      if (eventId) {
        list = list.filter((i) => i.eventId === eventId);
      }
      setItems(list);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function handleMarkAll() {
    await markAllRead();
    await load();
    await refreshInbox();
  }

  async function handleMarkOne(id) {
    await notificationsApi.markInboxRead({ inboxId: id });
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    await refreshInbox();
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error) {
    return (
      <>
        <p className="error">{error}</p>
        <button type="button" className="btn btn-ghost" onClick={load}>
          Retry
        </button>
      </>
    );
  }

  if (items.length === 0) {
    return <p className="muted">No notifications yet.</p>;
  }

  const unread = items.filter((i) => !i.read).length;

  return (
    <>
      <div className="card-header-row">
        <p className="muted">{unread} unread</p>
        {unread > 0 && (
          <button type="button" className="btn btn-ghost" onClick={handleMarkAll}>
            Mark all read
          </button>
        )}
      </div>
      <ul className="notifications-list">
        {items.map((n) => (
          <li
            key={n.id}
            className={`notification-item${n.read ? "" : " unread"}`}
          >
            <p className="notification-title">{n.title}</p>
            <p className="notification-body">{n.body}</p>
            <p className="notification-time">
              {formatTime(n.createdAt)}
              {n.eventId && (
                <>
                  {" · "}
                  <Link to={`/events/${n.eventId}`}>View event</Link>
                </>
              )}
            </p>
            {!n.read && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: "0.5rem" }}
                onClick={() => handleMarkOne(n.id)}
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
