import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCallableErrorMessage } from "../api/callable";
import * as organizerApi from "../api/eventsOrganizer";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toLocalDatetimeInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultStartLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(0, 0, 0);
  return toLocalDatetimeInput(d);
}

function defaultEndLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(d.getHours() + 2);
  d.setMinutes(0, 0, 0);
  return toLocalDatetimeInput(d);
}

export default function OrganizerPage() {
  const [myEvents, setMyEvents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState(defaultStartLocal);
  const [endAt, setEndAt] = useState(defaultEndLocal);
  const [capacity, setCapacity] = useState("30");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [publishingId, setPublishingId] = useState(null);

  const loadMyEvents = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await organizerApi.listMyEvents();
      setMyEvents(data.events || []);
    } catch (err) {
      setListError(getCallableErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyEvents();
  }, [loadMyEvents]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      await organizerApi.createEvent({
        title: title.trim(),
        description: description.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        capacity: Number(capacity),
      });
      setCreateSuccess("Draft saved.");
      setTitle("");
      setDescription("");
      await loadMyEvents();
    } catch (err) {
      setCreateError(getCallableErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handlePublish(eventId) {
    setPublishingId(eventId);
    try {
      await organizerApi.publishEvent({ eventId });
      await loadMyEvents();
    } catch (err) {
      alert(getCallableErrorMessage(err));
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Create event</h2>
        <p className="muted">Save as draft, then publish when ready.</p>
        <form onSubmit={handleCreate} className="form">
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Starts
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </label>
            <label>
              Ends
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Capacity
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </label>
          {createError && <p className="error">{createError}</p>}
          {createSuccess && <p className="success">{createSuccess}</p>}
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Saving…" : "Save draft"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Your events</h2>
        {listLoading && <p className="muted">Loading…</p>}
        {listError && <p className="error">{listError}</p>}
        {!listLoading && !listError && myEvents.length === 0 && (
          <p className="muted">No events yet.</p>
        )}
        <ul className="event-list">
          {myEvents.map((ev) => (
            <li key={ev.eventId} className="event-item my-event-item">
              <div>
                <span className="event-title">{ev.title}</span>
                <span className="event-meta">
                  <span className={`status-pill status-${ev.status}`}>
                    {ev.status}
                  </span>
                  {" · "}
                  {formatDate(ev.startAt)}
                </span>
              </div>
              <div className="my-event-actions">
                <Link
                  to={`/organize/${ev.eventId}/materials`}
                  className="btn btn-ghost"
                >
                  Materials
                </Link>
                <Link
                  to={`/organize/${ev.eventId}/notify`}
                  className="btn btn-ghost"
                >
                  Notify
                </Link>
                {ev.status === "draft" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={publishingId === ev.eventId}
                    onClick={() => handlePublish(ev.eventId)}
                  >
                    {publishingId === ev.eventId ? "Publishing…" : "Publish"}
                  </button>
                )}
                {ev.status === "published" && (
                  <Link to={`/events/${ev.eventId}`} className="btn btn-ghost">
                    View
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
