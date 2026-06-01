import { useState } from "react";
import { getCallableErrorMessage } from "../api/callable";
import * as notificationsApi from "../api/notifications";

export default function EnqueueNotificationForm({ eventId, onSent }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await notificationsApi.enqueueNotification({
        eventId,
        type: "announcement",
        title: title.trim(),
        body: body.trim(),
      });
      setSuccess("Sent to registered students (inbox + email).");
      setTitle("");
      setBody("");
      if (onSent) setTimeout(onSent, 800);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label>
        Message
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? "Sending…" : "Send to attendees"}
      </button>
    </form>
  );
}
