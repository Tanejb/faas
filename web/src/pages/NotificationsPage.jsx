import NotificationsList from "../components/NotificationsList";

export default function NotificationsPage() {
  return (
    <section className="card">
      <h2>Notifications</h2>
      <p className="hint">
        Messages processed via Pub/Sub (<code>enqueueNotification</code> →{" "}
        <code>processNotification</code>).
      </p>
      <NotificationsList />
    </section>
  );
}
