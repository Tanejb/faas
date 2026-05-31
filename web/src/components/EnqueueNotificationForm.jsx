import { useState } from "react";
import { getCallableErrorMessage } from "../api/callable";
import * as notificationsApi from "../api/notifications";

export default function EnqueueNotificationForm({ eventId, onSent }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("manual");
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
        type: type.trim() || "manual",
        title: title.trim(),
        body: body.trim(),
      });
      setSuccess("Notification queued (Pub/Sub → processNotification).");
      setTitle("");
      setBody("");
      if (onSent) {
        setTimeout(onSent, 600);
      }
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="notify-form">
      <label>
        Type
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="manual"
        />
      </label>
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
      <button type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send notification"}
      </button>
    </form>
  );
}
